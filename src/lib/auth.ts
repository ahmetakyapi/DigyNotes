import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// ── Basit in-memory login rate limit ────────────────────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_MAX = 8;
const LOGIN_WINDOW_MS = 5 * 60_000; // 5 dakika

function checkLoginRateLimit(email: string): boolean {
  const now = Date.now();
  const key = `login:${email}`;
  const entry = loginAttempts.get(key);

  if (!entry || entry.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }

  if (entry.count >= LOGIN_MAX) return false;

  entry.count += 1;
  return true;
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const normalizedEmail = credentials.email.toLowerCase();

        // Rate limit kontrolü
        if (!checkLoginRateLimit(normalizedEmail)) return null;

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user) return null;
        if (user.isBanned) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id: string } & typeof session.user).id = token.id as string;
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
