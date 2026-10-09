"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { useTheme } from "@/components/ThemeProvider";
import { customLoader } from "@/lib/image";
import { ArrowUpRightIcon, CaretRightIcon, CheckIcon, XIcon } from "@phosphor-icons/react";
import { PageHeader, Em, Dot } from "@/components/ui/PageHeader";

const inputBase =
  "w-full h-12 px-4 rounded-2xl text-[var(--text-primary)] placeholder:text-[var(--text-faint)] bg-[var(--bg-card)] border border-[var(--border)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-200 ease-out-expo text-[16px] sm:text-sm";
const textareaBase =
  "w-full px-4 py-3 rounded-2xl text-[var(--text-primary)] placeholder:text-[var(--text-faint)] bg-[var(--bg-card)] border border-[var(--border)] focus:outline-none focus:border-[var(--text-primary)] transition-colors duration-200 ease-out-expo text-[16px] sm:text-sm leading-relaxed resize-none";
const labelClass =
  "dn-mono block text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)] mb-2";
const rowButtonClass =
  "group flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3.5 text-left transition-colors duration-200 ease-out-expo hover:border-[var(--text-primary)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";
const errorTextClass = "mt-1.5 text-xs text-[var(--danger)]";

/* LAYOUT: settings section — left rail (mono index + label + short note), right column fields.
   Sections are separated by hairlines instead of boxed cards. */
function SettingsSection({
  index,
  label,
  note,
  className = "",
  children,
}: {
  index: string;
  label: string;
  note?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`grid gap-5 border-t border-[var(--border)] py-8 md:grid-cols-[200px_minmax(0,1fr)] md:gap-10 ${className}`}
    >
      <div>
        <p className="dn-mono flex items-center gap-2 text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          <span className="text-[var(--gold)]">({index})</span>
          {label}
        </p>
        {note && (
          <p className="mt-2 max-w-[220px] text-xs leading-5 text-[var(--text-faint)]">{note}</p>
        )}
      </div>
      <div className="min-w-0 space-y-5">{children}</div>
    </section>
  );
}

/* LAYOUT: pill switch — accent track when on, raised track + hairline when off */
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-300 ease-out-expo ${
        checked ? "border-accent bg-accent" : "border-[var(--border)] bg-[var(--bg-raised)]"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full transition-transform duration-300 ease-out-expo ${
          checked
            ? "translate-x-[22px] bg-[var(--text-on-accent)]"
            : "translate-x-[3px] bg-[var(--text-muted)]"
        }`}
      />
    </button>
  );
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
}

type ExportFormat = "csv" | "json";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const [exportMessage, setExportMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "ok" | "taken" | "invalid"
  >("idle");
  const usernameCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) {
          toast.error("Profil yüklenemedi");
          setLoading(false);
          return;
        }
        setProfile(data);
        setUsername(data.username ?? "");
        setBio(data.bio ?? "");
        setAvatarUrl(data.avatarUrl ?? "");
        setIsPublic(data.isPublic);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Profil yüklenemedi");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (usernameCheckRef.current) {
        clearTimeout(usernameCheckRef.current);
      }
    };
  }, []);

  const checkUsername = useCallback(
    (val: string) => {
      if (!val) {
        setUsernameStatus("idle");
        return;
      }
      if (val === profile?.username) {
        setUsernameStatus("ok");
        return;
      }
      if (!/^[a-z0-9_]{3,20}$/.test(val)) {
        setUsernameStatus("invalid");
        return;
      }
      setUsernameStatus("checking");
      if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current);
      usernameCheckRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/users/${val}`);
          setUsernameStatus(res.ok ? "taken" : "ok");
        } catch {
          setUsernameStatus("ok");
        }
      }, 500);
    },
    [profile?.username]
  );

  const handleUsernameChange = (val: string) => {
    const normalized = val.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(normalized);
    checkUsername(normalized);
  };

  const handleSave = async () => {
    if (!username.trim()) {
      toast.error("Kullanıcı adı boş bırakılamaz");
      return;
    }
    if (usernameStatus === "taken") {
      toast.error("Bu kullanıcı adı zaten alınmış");
      return;
    }
    if (usernameStatus === "invalid") {
      toast.error("Geçersiz kullanıcı adı formatı");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, bio, avatarUrl, isPublic }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Kaydedilemedi");
        return;
      }
      toast.success("Profil güncellendi");
      router.push("/notes");
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Tüm alanları doldur");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Yeni şifre en az 8 karakter olmalı");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/users/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Şifre değiştirilemedi");
        return;
      }
      toast.success("Şifren güncellendi");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    setExportingFormat(format);
    setExportMessage(null);

    try {
      const response = await fetch(`/api/users/me/export?format=${format}`);

      if (response.status === 401) {
        setExportMessage({
          tone: "error",
          text: "Oturumun kapanmış olabilir. Tekrar giriş yapıp yeniden dene.",
        });
        router.push("/login");
        return;
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Dosya hazırlanamadı. Biraz sonra tekrar dene.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="([^"]+)"/);
      const fallbackName = `digynotes-export.${format}`;
      const filename = match?.[1] || fallbackName;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setExportMessage({
        tone: "success",
        text:
          format === "csv"
            ? "CSV dosyan indirildi. Excel ya da Google E-Tablolar'da açabilirsin."
            : "JSON dosyan indirildi. Tüm verilerin eksiksiz içinde.",
      });
    } catch (error) {
      setExportMessage({
        tone: "error",
        text:
          error instanceof Error && error.message.trim()
            ? error.message
            : "İndirme tamamlanamadı. Bağlantını kontrol edip tekrar dene.",
      });
    } finally {
      setExportingFormat(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen py-10">
        <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
          <div className="h-3 w-40 animate-pulse rounded-full bg-[var(--bg-card)]" />
          <div className="h-14 w-72 animate-pulse rounded-2xl bg-[var(--bg-card)]" />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-[22px] border border-[var(--border)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      </main>
    );
  }

  const usernameHint = {
    idle: null,
    checking: <span className="text-[var(--text-muted)]">Kontrol ediliyor...</span>,
    ok: (
      <span className="inline-flex items-center gap-1 text-[var(--gold)]">
        <CheckIcon size={12} weight="bold" /> Kullanılabilir
      </span>
    ),
    taken: (
      <span className="inline-flex items-center gap-1 text-[var(--danger)]">
        <XIcon size={12} weight="bold" /> Bu kullanıcı adı alınmış
      </span>
    ),
    invalid: <span className="text-[var(--danger)]">3-20 karakter, yalnızca a-z, 0-9, _</span>,
  }[usernameStatus];

  return (
    <main className="min-h-screen py-8 pb-36 sm:py-10 sm:pb-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <PageHeader
          index="15"
          eyebrow="Profil Ayarları"
          title={
            <>
              Profilini <Em>Düzenle</Em>
              <Dot />
            </>
          }
          description="Profil bilgilerini güncelle, kimlerin görebileceğini seç ve istediğin zaman verilerini indir."
          actions={
            profile?.username ? (
              <Link
                href={`/profile/${profile.username}`}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-200 ease-out-expo hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] active:scale-95"
              >
                Profili Gör
                <ArrowUpRightIcon size={12} weight="bold" />
              </Link>
            ) : undefined
          }
        />

        {/* ── (01) Kimlik ── */}
        <SettingsSection
          index="01"
          label="Profil Bilgileri"
          note="Profilinde görünen fotoğraf, kullanıcı adı ve kısa tanıtım."
          className="border-t-0 pt-2"
        >
          <div>
            <label htmlFor="settings-avatar" className={labelClass}>
              Profil Fotoğrafı Bağlantısı
            </label>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-raised)]">
                {avatarUrl ? (
                  <Image
                    loader={customLoader}
                    src={avatarUrl}
                    alt="Avatar"
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="dn-display text-3xl italic text-[var(--gold)]">
                    {profile?.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <input
                id="settings-avatar"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className={`${inputBase} flex-1`}
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="settings-username" className={labelClass}>
              Kullanıcı Adı
            </label>
            <div className="relative">
              <span className="dn-mono absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">
                @
              </span>
              <input
                id="settings-username"
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className={`${inputBase} pl-9`}
                placeholder="kullanici_adi"
                maxLength={20}
              />
            </div>
            {usernameHint && <p className="mt-1.5 text-xs">{usernameHint}</p>}
            {username && (
              <p className="dn-mono mt-1.5 text-[10.5px] tracking-[0.04em] text-[var(--text-faint)]">
                /profile/{username}
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="settings-bio" className={`${labelClass} mb-0`}>
                Hakkında
              </label>
              <span className="dn-mono text-[10.5px] tabular-nums text-[var(--text-faint)]">
                {bio.length}/200
              </span>
            </div>
            <textarea
              id="settings-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              rows={3}
              className={textareaBase}
              placeholder="Kendinden kısaca bahset..."
            />
          </div>
        </SettingsSection>

        {/* ── (02) Gizlilik ── */}
        <SettingsSection index="02" label="Gizlilik" note="Profilini kimlerin görebileceğini seç.">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-base font-medium text-[var(--text-primary)]">
                Profili Herkese Açık Yap
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                Açıkken profilini ve notlarını herkes görebilir.
              </p>
            </div>
            <Toggle
              checked={isPublic}
              onChange={() => setIsPublic((v) => !v)}
              label="Profili Herkese Açık Yap"
            />
          </div>
        </SettingsSection>

        {/* ── (03) Güvenlik ── */}
        <SettingsSection index="03" label="Şifre" note="Şifreni buradan değiştirebilirsin.">
          <div>
            <label htmlFor="settings-current-password" className={labelClass}>
              Mevcut Şifre
            </label>
            <input
              id="settings-current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputBase}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="settings-new-password" className={labelClass}>
                Yeni Şifre
              </label>
              <input
                id="settings-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputBase}
                placeholder="En az 8 karakter"
                minLength={8}
                autoComplete="new-password"
              />
              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className={errorTextClass}>En az 8 karakter gerekli</p>
              )}
            </div>
            <div>
              <label htmlFor="settings-confirm-password" className={labelClass}>
                Yeni Şifre (Tekrar)
              </label>
              <input
                id="settings-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputBase}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className={errorTextClass}>Şifreler eşleşmiyor</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handlePasswordChange}
            disabled={
              changingPassword ||
              !currentPassword ||
              !newPassword ||
              newPassword !== confirmPassword ||
              newPassword.length < 8
            }
            className="cursor-pointer rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors duration-200 ease-out-expo hover:border-[var(--text-primary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {changingPassword ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
          </button>
        </SettingsSection>

        {/* ── (04) Uygulama — mobilde tema ve bildirimler ── */}
        <SettingsSection
          index="04"
          label="Uygulama Ayarları"
          note="Tema ve bildirimler."
          className="sm:hidden"
        >
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-base font-medium text-[var(--text-primary)]">
                {theme === "dark" ? "Koyu Tema" : "Açık Tema"}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Açık ya da koyu tema</p>
            </div>
            <Toggle checked={theme === "dark"} onChange={toggleTheme} label="Koyu Tema" />
          </div>

          <Link href="/notifications" className={rowButtonClass}>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Bildirimler</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">Bildirimlerini gör</p>
            </div>
            <CaretRightIcon
              size={16}
              className="text-[var(--text-muted)] transition-transform duration-200 ease-out-expo group-hover:translate-x-0.5"
            />
          </Link>
        </SettingsSection>

        {/* ── (05) Verilerini İndir ── */}
        <SettingsSection
          index="05"
          label="Verilerini İndir"
          note="Notların, koleksiyonların ve istek listen tek dosyada."
        >
          <p className="border-l-2 border-accent/60 pl-4 text-sm leading-6 text-[var(--text-secondary)]">
            CSV&apos;yi Excel gibi tablo programlarında açabilirsin. JSON ise tüm verilerini
            eksiksiz saklar; yedek almak için daha uygun.
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleExport("csv")}
              disabled={exportingFormat !== null}
              className={rowButtonClass}
            >
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Excel İndir</p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Tablo olarak açmak için CSV dosyası
                </p>
              </div>
              <span className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--gold)]">
                {exportingFormat === "csv" ? "Hazırlanıyor..." : "CSV"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleExport("json")}
              disabled={exportingFormat !== null}
              className={rowButtonClass}
            >
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">JSON İndir</p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Tüm verilerin, JSON dosyası olarak
                </p>
              </div>
              <span className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--gold)]">
                {exportingFormat === "json" ? "Hazırlanıyor..." : "JSON"}
              </span>
            </button>
          </div>
          {exportMessage && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                exportMessage.tone === "success"
                  ? "border-accent/25 bg-accent/10 text-[var(--gold)]"
                  : "border-[color-mix(in_srgb,var(--danger)_25%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] text-[var(--danger)]"
              }`}
            >
              {exportMessage.text}
            </div>
          )}
          <p className="text-[11px] leading-5 text-[var(--text-faint)]">
            İndirme başlamazsa sayfayı yenileyip tekrar dene ya da daha küçük olan CSV&apos;yi seç.
          </p>
        </SettingsSection>
      </div>

      {/* LAYOUT: floating glass pill save bar — visibility status left, İptal + Kaydet right */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:pb-6">
        <div className="pointer-events-auto mx-auto flex max-w-xl items-center justify-between gap-4 rounded-full border border-[var(--border)] bg-[var(--header-glass)] py-2 pl-5 pr-2 shadow-[var(--shadow-soft)] backdrop-blur-xl">
          <p className="dn-mono flex min-w-0 items-center gap-2 truncate text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            <span
              className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                isPublic ? "bg-[var(--gold)]" : "bg-[var(--text-faint)]"
              }`}
            />
            {isPublic ? "Profilin herkese açık" : "Profilin gizli"}
          </p>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => router.back()}
              className="cursor-pointer rounded-full px-4 py-2 text-sm text-[var(--text-muted)] transition-colors duration-200 ease-out-expo hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] active:scale-95"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={
                saving ||
                usernameStatus === "taken" ||
                usernameStatus === "invalid" ||
                usernameStatus === "checking"
              }
              className="cursor-pointer rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-[var(--text-on-accent)] transition-all duration-200 ease-out-expo hover:bg-accent-dark active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
        {/* iOS safe-area spacer */}
        <div className="sm:hidden" style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
      </div>
    </main>
  );
}
