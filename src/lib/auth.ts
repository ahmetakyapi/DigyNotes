import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { consumeRateLimit } from "./rate-limit";
import { isCurrentPasswordVersion, passwordVersion } from "./password-version";

// ── Login rate limit ────────────────────────────────────────────────
// Shared limiter (Upstash when configured, in-memory fallback): per address against
// guessing one account, per IP against spraying one password over many accounts.
const LOGIN_MAX_PER_EMAIL = 8;
const LOGIN_MAX_PER_IP = 30;
const LOGIN_WINDOW_MS = 5 * 60_000; // 5 dakika

// consumeRateLimit reads the client IP from a Request; authorize only gets plain headers.
function toLimiterRequest(headers: Record<string, unknown> | undefined) {
  const forwarded: Record<string, string> = {};
  for (const name of ["x-forwarded-for", "x-real-ip"]) {
    const value = headers?.[name];
    if (typeof value === "string" && value) forwarded[name] = value;
  }
  return new Request("http://localhost/api/auth/callback/credentials", { headers: forwarded });
}
// ────────────────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const normalizedEmail = credentials.email.trim().toLowerCase();

        // Rate limit kontrolü — thrown, so signIn() returns error "RATE_LIMITED" and the
        // login page says "too many attempts" instead of "wrong password".
        const limiterReq = toLimiterRequest(req?.headers);
        const [byEmail, byIp] = await Promise.all([
          consumeRateLimit({
            action: "auth-login-email",
            req: limiterReq,
            userId: `email:${normalizedEmail}`,
            limit: LOGIN_MAX_PER_EMAIL,
            windowMs: LOGIN_WINDOW_MS,
          }),
          consumeRateLimit({
            action: "auth-login-ip",
            req: limiterReq,
            limit: LOGIN_MAX_PER_IP,
            windowMs: LOGIN_WINDOW_MS,
          }),
        ]);
        if (!byEmail.success || !byIp.success) throw new Error("RATE_LIMITED");

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user) return null;
        if (user.isBanned) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name, pwv: passwordVersion(user.password) };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // pwv is stamped only at sign-in, never refreshed (not even on update()), so a
      // session can't re-bless itself after the password changes.
      if (user) {
        token.id = user.id;
        token.pwv = (user as { pwv?: string }).pwv;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const userWithId = session.user as { id: string; avatarUrl?: string | null } & typeof session.user;
        userWithId.id = token.id as string;

        // Banlanmış ya da silinmiş kullanıcıyı ve son şifre değişikliğinden (sıfırlama ya da
        // ayarlar) önce açılmış oturumları düşür + avatar bilgisini session'a ekle.
        // The hash is only compared here, never copied onto the session.
        let dbUser;
        try {
          dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { isBanned: true, avatarUrl: true, password: true },
          });
        } catch (error) {
          // A DB blip is not a revoked session: next-auth would turn a throw into "no
          // session" and clear the cookie. The data APIs fail on their own meanwhile.
          console.error("[auth] session lookup failed", error);
          userWithId.avatarUrl = null;
          return session;
        }
        if (!dbUser || dbUser.isBanned || !isCurrentPasswordVersion(token.pwv, dbUser.password)) {
          return null as unknown as typeof session;
        }
        userWithId.avatarUrl = dbUser.avatarUrl ?? null;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        }).catch(() => {});
      }
    },
    async signOut({ token }) {
      const id = (token as { id?: string })?.id;
      if (id) {
        await prisma.user.update({
          where: { id },
          data: { lastLogoutAt: new Date() },
        }).catch(() => {});
      }
    },
  },
};
