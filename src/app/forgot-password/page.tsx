"use client";

/*
  LAYOUT: AuthShell (same as /login). Form state: e-mail field → primary pill button →
  "Giriş Yap" link. Sent state: the shell switches to "E-postanı Kontrol Et" with the
  address in the subtitle, a resend button with a cooldown, then a link back to login.
*/
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { AuthShell } from "@/components/AuthShell";
import { FormStatusMessage } from "@/components/FormStatusMessage";
import { getClientErrorMessage, requestJson } from "@/lib/client-api";

const RESEND_COOLDOWN_S = 60;

function Spinner() {
  return (
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
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Prefill from /login's "Şifremi Unuttum" link (?email=…); read here instead of
  // useSearchParams so the page needs no Suspense boundary.
  useEffect(() => {
    const prefill = new URLSearchParams(window.location.search).get("email");
    if (prefill) setEmail(prefill);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const requestLink = async (address: string) => {
    setError("");
    setLoading(true);
    try {
      await requestJson(
        "/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: address }),
        },
        "Bağlantı gönderilemedi."
      );
      setSentTo(address);
      setCooldown(RESEND_COOLDOWN_S);
      return true;
    } catch (err) {
      const message = getClientErrorMessage(err, "Bağlantı gönderilemedi.");
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void requestLink(email.trim().toLowerCase());
  };

  const handleResend = async () => {
    if (!sentTo || cooldown > 0) return;
    if (await requestLink(sentTo)) toast.success("Bağlantıyı tekrar gönderdik.");
  };

  if (sentTo) {
    return (
      <AuthShell
        mode="forgotSent"
        subtitle={
          <>
            <span className="font-medium text-[var(--text-primary)]">{sentTo}</span> adresine
            kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderdik. Bağlantı 60 dakika
            geçerli.
          </>
        }
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <EnvelopeSimpleIcon size={18} />
            </span>
            <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
              E-posta birkaç dakika içinde gelmezse gereksiz klasörüne bak ya da aşağıdan tekrar
              gönder.
            </p>
          </div>

          {error && <FormStatusMessage message={error} />}

          <button
            type="button"
            onClick={handleResend}
            disabled={loading || cooldown > 0}
            className="h-[52px] w-full cursor-pointer rounded-full border border-[var(--border)] text-[15px] font-semibold text-[var(--text-primary)] transition-colors duration-200 hover:border-accent/40 hover:bg-accent/5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                Gönderiliyor...
              </span>
            ) : cooldown > 0 ? (
              <span>
                Tekrar Gönder <span className="dn-mono text-[13px]">({cooldown} sn)</span>
              </span>
            ) : (
              "Tekrar Gönder"
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setSentTo(null);
              setError("");
            }}
            className="w-full cursor-pointer text-center text-[13px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            Farklı bir e-posta dene
          </button>
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

  return (
    <AuthShell mode="forgot">
      <div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="forgot-email"
              className="mb-2 block text-[12.5px] font-medium text-[var(--text-muted)]"
            >
              E-posta
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              placeholder="ornek@mail.com"
              className="dn-input-auth h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 text-[16px] text-[var(--text-primary)] outline-hidden transition-all duration-200 placeholder:text-[var(--text-muted)] sm:text-sm"
            />
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
                Gönderiliyor...
              </span>
            ) : (
              "Bağlantı Gönder"
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-xs text-[var(--text-muted)]">veya</span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <p className="text-center text-sm text-[var(--text-secondary)]">
          Şifreni hatırladın mı?{" "}
          <Link href="/login" className="dn-auth-link font-medium transition-colors">
            Giriş Yap
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
