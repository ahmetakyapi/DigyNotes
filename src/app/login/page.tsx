"use client";
import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { AuthShell } from "@/components/AuthShell";
import { WelcomeCover, queueWelcome } from "@/components/intro/Welcome";
import { FormStatusMessage } from "@/components/FormStatusMessage";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const publishError = (message: string) => {
    setError(message);
    toast.error(message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        publishError("E-posta veya şifre hatalı.");
        return;
      }

      const session = await getSession().catch(() => null);
      queueWelcome(session?.user?.name);
      setRedirecting(true);
      router.push("/notes");
      router.refresh();
    } catch {
      publishError("Giriş şu anda tamamlanamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell mode="login">
      <WelcomeCover show={redirecting} />
      <div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="dn-mono mb-2 block text-[10.5px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]"
            >
              E-posta
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="ornek@mail.com"
              className="dn-input-auth h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 text-[16px] text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] sm:text-sm"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="dn-mono mb-2 block text-[10.5px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]"
            >
              Şifre
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="dn-input-auth h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 pr-12 text-[16px] text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? "Şifreyi gizle" : "Şifreyi göster"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
                tabIndex={-1}
              >
                {showPw ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                      strokeLinecap="round"
                    />
                    <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && <FormStatusMessage message={error} />}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="dn-btn-primary-auth h-[52px] w-full cursor-pointer rounded-full text-[15px] font-semibold transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.3" />
                  <path d="M21 12a9 9 0 00-9-9" strokeLinecap="round" />
                </svg>
                Giriş yapılıyor...
              </span>
            ) : (
              "Giriş Yap"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-xs text-[var(--text-muted)]">veya</span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-[var(--text-secondary)]">
          Hesabın yok mu?{" "}
          <Link href="/register" className="dn-auth-link font-medium transition-colors">
            Kayıt Ol
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
