"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { FullScreenLoader } from "@/components/FullScreenLoader";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPw) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, username }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Bir hata oluştu.");
      return;
    }

    // Auto-login after register
    const loginResult = await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (loginResult?.error) {
      router.push("/login");
    } else {
      setRedirecting(true);
      router.push("/notes");
      router.refresh();
    }
  };

  const strength =
    password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--bg-base)] px-4 py-12">
      <FullScreenLoader show={redirecting} message="Hesabınız oluşturuluyor..." />
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-gradient-radial from-[#c4a24b]/6 absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full to-transparent blur-3xl" />
        <div className="bg-gradient-radial from-[#4a90e2]/4 absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full to-transparent blur-3xl" />
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
            <h1 className="mb-1 text-2xl font-bold text-[var(--text-primary)]">Hesap Oluştur</h1>
            <p className="text-sm text-[var(--text-muted)]">Notlarını kaydetmeye hemen başla.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Ad Soyad
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Adın Soyadın"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-200 focus:border-[#c4a24b]/50 focus:ring-1 focus:ring-[#c4a24b]/10"
              />
            </div>

            {/* Username */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[var(--text-muted)]">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                  }
                  required
                  autoComplete="username"
                  placeholder="kullanici_adin"
                  minLength={3}
                  maxLength={30}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] py-3 pl-8 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-200 focus:border-[#c4a24b]/50 focus:ring-1 focus:ring-[#c4a24b]/10"
                />
              </div>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                Harf, rakam ve _ kullanabilirsin. Sonradan değiştirilebilir.
              </p>
            </div>

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
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-200 focus:border-[#c4a24b]/50 focus:ring-1 focus:ring-[#c4a24b]/10"
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
                  autoComplete="new-password"
                  placeholder="En az 6 karakter"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] px-4 py-3 pr-12 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-200 focus:border-[#c4a24b]/50 focus:ring-1 focus:ring-[#c4a24b]/10"
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
              {/* Password strength */}
              {password.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`h-0.5 flex-1 rounded-full transition-colors ${
                        strength >= s
                          ? s === 1
                            ? "bg-[#e53e3e]"
                            : s === 2
                              ? "bg-[#f6ad55]"
                              : "bg-[#48bb78]"
                          : "bg-[var(--border)]"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-[10px] text-[var(--text-muted)]">
                    {strength === 1 ? "Zayıf" : strength === 2 ? "Orta" : "Güçlü"}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Şifre (Tekrar)
              </label>
              <input
                type={showPw ? "text" : "password"}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Şifreyi tekrar girin"
                className={`w-full rounded-xl border bg-[var(--bg-raised)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-200 focus:ring-1 focus:ring-[#c4a24b]/10 ${
                  confirmPw && confirmPw !== password
                    ? "border-[#e53e3e]/50 focus:border-[#e53e3e]/70"
                    : "border-[var(--border)] focus:border-[#c4a24b]/50"
                }`}
              />
              {confirmPw && confirmPw !== password && (
                <p className="mt-1 text-xs text-[#e53e3e]">Şifreler eşleşmiyor</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-[#e53e3e]/8 flex items-center gap-2 rounded-xl border border-[#e53e3e]/20 px-4 py-3 text-sm text-[#e53e3e]">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[#c4a24b] py-3.5 text-sm font-semibold text-[var(--text-on-accent)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#d7ba68] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
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
                  Hesap oluşturuluyor...
                </span>
              ) : (
                "Hesap Oluştur"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-muted)]">veya</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-[var(--text-secondary)]">
            Zaten hesabın var mı?{" "}
            <Link
              href="/login"
              className="font-medium text-[#c4a24b] transition-colors hover:text-[#d7ba68]"
            >
              Giriş Yap
            </Link>
          </p>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]">
            ← Ana sayfaya dön
          </Link>
        </div>
      </div>
    </div>
  );
}
