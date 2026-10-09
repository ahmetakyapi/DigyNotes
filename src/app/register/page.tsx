"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { AuthShell } from "@/components/AuthShell";
import { WelcomeCover, queueWelcome } from "@/components/intro/Welcome";
import { FormStatusMessage } from "@/components/FormStatusMessage";
import PasswordStrength from "@/components/PasswordStrength";
import { getClientErrorMessage, requestJson } from "@/lib/client-api";

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

  const publishError = (message: string) => {
    setError(message);
    toast.error(message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPw) {
      publishError("Şifreler eşleşmiyor.");
      return;
    }
    if (password.length < 6) {
      publishError("Şifre en az 6 karakter olmalı.");
      return;
    }

    setLoading(true);

    try {
      await requestJson(
        "/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, username }),
        },
        "Hesap oluşturulamadı."
      );

      const loginResult = await signIn("credentials", {
        email: email.toLowerCase(),
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        toast.success("Hesabın oluşturuldu. Devam etmek için giriş yapabilirsin.");
        router.push("/login");
        return;
      }

      queueWelcome(name);
      setRedirecting(true);
      router.push("/notes");
      router.refresh();
    } catch (error) {
      publishError(getClientErrorMessage(error, "Hesap oluşturulamadı."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell mode="register">
      <WelcomeCover show={redirecting} />
      <div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="reg-name"
              className="dn-mono mb-2 block text-[10.5px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]"
            >
              Ad Soyad
            </label>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Adın Soyadın"
              className="dn-input-auth h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 text-[16px] text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] sm:text-sm"
            />
          </div>

          {/* Username */}
          <div>
            <label
              htmlFor="reg-username"
              className="dn-mono mb-2 block text-[10.5px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]"
            >
              Kullanıcı Adı
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[var(--text-muted)]">
                @
              </span>
              <input
                id="reg-username"
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replaceAll(/[^a-z0-9_]/g, ""))
                }
                required
                autoComplete="username"
                placeholder="kullanici_adin"
                minLength={3}
                maxLength={30}
                className="dn-input-auth w-full rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] py-3 pl-8 pr-4 text-[16px] text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] sm:text-sm"
              />
            </div>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Harf, rakam ve _ kullanabilirsin. Sonradan değiştirilebilir.
            </p>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="reg-email"
              className="dn-mono mb-2 block text-[10.5px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]"
            >
              E-posta
            </label>
            <input
              id="reg-email"
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
              htmlFor="reg-password"
              className="dn-mono mb-2 block text-[10.5px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]"
            >
              Şifre
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="En az 6 karakter"
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
            {/* Password strength */}
            <PasswordStrength password={password} />
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="reg-confirm-password"
              className="dn-mono mb-2 block text-[10.5px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]"
            >
              Şifre (Tekrar)
            </label>
            <input
              id="reg-confirm-password"
              type={showPw ? "text" : "password"}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Şifreyi tekrar girin"
              className={`dn-input-auth w-full rounded-xl border bg-[var(--bg-raised)] px-4 py-3 text-[16px] text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] sm:text-sm ${
                confirmPw && confirmPw !== password
                  ? "dn-input-auth-error border-danger/50"
                  : "border-[var(--border)]"
              }`}
            />
            {confirmPw && confirmPw !== password && (
              <p className="mt-1 text-xs text-danger">Şifreler eşleşmiyor</p>
            )}
          </div>

          {/* Error */}
          {error && <FormStatusMessage message={error} />}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="dn-btn-primary-auth mt-2 w-full rounded-xl py-3.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
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
          <Link href="/login" className="dn-auth-link font-medium transition-colors">
            Giriş Yap
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
