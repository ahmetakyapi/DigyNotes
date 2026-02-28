"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { FullScreenLoader } from "@/components/FullScreenLoader";
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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--bg-base)] px-4">
      <FullScreenLoader show={redirecting} message="Giriş yapılıyor..." />
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-gradient-radial from-[#c4a24b]/6 absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full to-transparent blur-3xl" />
        <div className="bg-gradient-radial from-[#4a90e2]/4 absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full to-transparent blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center">
          <Link href="/">
            <Image
              src="/app-logo.png"
              alt="DigyNotes"
              width={240}
              height={74}
              className="object-contain"
              unoptimized
            />
          </Link>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8">
          <div className="mb-8">
            <h1 className="mb-1 text-2xl font-bold text-[var(--text-primary)]">Hoş Geldiniz</h1>
            <p className="text-sm text-[var(--text-muted)]">Devam etmek için giriş yapın.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="ornek@mail.com"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] px-4 py-3 text-[16px] text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] focus:border-[#c4a24b]/50 focus:ring-1 focus:ring-[#c4a24b]/10 sm:text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Şifre
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] px-4 py-3 pr-12 text-[16px] text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] focus:border-[#c4a24b]/50 focus:ring-1 focus:ring-[#c4a24b]/10 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
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
                      <path
                        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                        strokeLinecap="round"
                      />
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
              className="w-full rounded-xl bg-[#c4a24b] py-3.5 text-sm font-semibold text-[var(--text-on-accent)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#d7ba68] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
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
            <Link
              href="/register"
              className="font-medium text-[#c4a24b] transition-colors hover:text-[#d7ba68]"
            >
              Kayıt Ol
            </Link>
          </p>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
          >
            ← Ana sayfaya dön
          </Link>
        </div>
      </div>
    </div>
  );
}
