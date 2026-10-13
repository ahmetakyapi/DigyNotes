"use client";

/*
  LAYOUT: AuthShell (same as /login). Checks the ?token first (spinner), then either
  new password (show/hide + strength meter) → confirm → primary pill button, or an
  "invalid link" state with a button to request a new link.
*/
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { AuthShell } from "@/components/AuthShell";
import { FormStatusMessage } from "@/components/FormStatusMessage";
import PasswordStrength from "@/components/PasswordStrength";
import { getClientErrorMessage, isClientApiError, requestJson } from "@/lib/client-api";

const INVALID_LINK = "Bağlantının süresi dolmuş ya da geçersiz. Yeni bir bağlantı iste.";

type TokenState = "checking" | "valid" | "invalid";

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`${className} animate-spin`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.3" />
      <path d="M21 12a9 9 0 00-9-9" strokeLinecap="round" />
    </svg>
  );
}

function EyeToggleIcon({ visible }: { visible: boolean }) {
  return visible ? (
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
  );
}

function InvalidLink() {
  return (
    <AuthShell mode="resetInvalid">
      <div className="space-y-5">
        <p className="text-[14px] leading-relaxed text-[var(--text-secondary)]">
          Güvenliğin için sıfırlama bağlantıları 60 dakika geçerli ve yalnızca bir kez
          kullanılabiliyor. Yeni bir bağlantı isteyip e-postandaki son bağlantıyı kullan.
        </p>
        <Link
          href="/forgot-password"
          className="dn-btn-primary-auth flex h-[52px] w-full items-center justify-center rounded-full text-[15px] font-semibold transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
        >
          Yeni Bağlantı İste
        </Link>
      </div>
      <div className="my-6 h-px bg-[var(--border)]" />
      <p className="text-center text-sm text-[var(--text-secondary)]">
        Şifreni hatırladın mı?{" "}
        <Link href="/login" className="dn-auth-link font-medium transition-colors">
          Giriş Yap
        </Link>
      </p>
    </AuthShell>
  );
}

function CheckingLink() {
  return (
    <AuthShell mode="reset">
      <div className="flex items-center justify-center gap-2 py-6 text-[13px] font-medium text-[var(--text-muted)]">
        <Spinner />
        Bağlantı kontrol ediliyor...
      </div>
    </AuthShell>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [tokenState, setTokenState] = useState<TokenState>(token ? "checking" : "invalid");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenState("invalid");
      return;
    }
    let cancelled = false;
    requestJson<{ valid?: boolean }>(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((data) => {
        if (!cancelled) setTokenState(data?.valid ? "valid" : "invalid");
      })
      // A failed check (offline, rate limit) shouldn't block the form; the POST verifies again.
      .catch(() => {
        if (!cancelled) setTokenState("valid");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const publishError = (message: string) => {
    setError(message);
    toast.error(message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      publishError("Yeni şifre en az 8 karakter olmalıdır.");
      return;
    }
    if (password.length > 128) {
      publishError("Yeni şifre en fazla 128 karakter olabilir.");
      return;
    }
    if (password !== confirmPw) {
      publishError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    try {
      const data = await requestJson<{ email?: string | null }>(
        "/api/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        },
        "Şifre güncellenemedi."
      );
      toast.success("Şifren güncellendi, yeni şifrenle giriş yapabilirsin.");
      router.replace(data?.email ? `/login?email=${encodeURIComponent(data.email)}` : "/login");
    } catch (err) {
      const message = getClientErrorMessage(err, "Şifre güncellenemedi.");
      if (isClientApiError(err, 400) && message === INVALID_LINK) {
        toast.error(message);
        setTokenState("invalid");
        return;
      }
      publishError(message);
    } finally {
      setLoading(false);
    }
  };

  if (tokenState === "checking") return <CheckingLink />;
  if (tokenState === "invalid") return <InvalidLink />;

  return (
    <AuthShell mode="reset">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* New password */}
        <div>
          <label
            htmlFor="reset-password"
            className="mb-2 block text-[12.5px] font-medium text-[var(--text-muted)]"
          >
            Yeni Şifre
          </label>
          <div className="relative">
            <input
              id="reset-password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              placeholder="En az 8 karakter"
              className="dn-input-auth h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 pr-12 text-[16px] text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] sm:text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              aria-label={showPw ? "Şifreyi gizle" : "Şifreyi göster"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
              tabIndex={-1}
            >
              <EyeToggleIcon visible={showPw} />
            </button>
          </div>
          <PasswordStrength password={password} />
        </div>

        {/* Confirm */}
        <div>
          <label
            htmlFor="reset-confirm-password"
            className="mb-2 block text-[12.5px] font-medium text-[var(--text-muted)]"
          >
            Yeni Şifre (Tekrar)
          </label>
          <input
            id="reset-confirm-password"
            type={showPw ? "text" : "password"}
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Şifreyi tekrar gir"
            className={`dn-input-auth h-12 w-full rounded-2xl border bg-[var(--bg-card)] px-4 text-[16px] text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] sm:text-sm ${
              confirmPw && confirmPw !== password
                ? "dn-input-auth-error border-danger/50"
                : "border-[var(--border)]"
            }`}
          />
          {confirmPw && confirmPw !== password && (
            <p className="mt-1.5 text-xs text-danger">Şifreler eşleşmiyor</p>
          )}
        </div>

        {error && <FormStatusMessage message={error} />}

        <button
          type="submit"
          disabled={loading}
          className="dn-btn-primary-auth h-[52px] w-full cursor-pointer rounded-full text-[15px] font-semibold transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner />
              Kaydediliyor...
            </span>
          ) : (
            "Şifremi Güncelle"
          )}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<CheckingLink />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
