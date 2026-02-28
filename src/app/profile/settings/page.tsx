"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { useTheme } from "@/components/ThemeProvider";

const inputBase =
  "w-full px-4 py-3 rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border)] focus:outline-none focus:border-[#c4a24b]/50 focus:ring-1 focus:ring-[#c4a24b]/20 transition-all text-[16px] sm:text-sm";
const labelClass =
  "block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] mb-2";
const sectionClass = "rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-5";
const customLoader = ({ src }: { src: string }) => src;

interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
}

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
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "ok" | "taken" | "invalid"
  >("idle");
  const usernameCheckRef = { current: null as ReturnType<typeof setTimeout> | null };

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
      toast.success("Profil güncellendi!");
      router.push("/notes");
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-10">
        <div className="mx-auto max-w-2xl space-y-4 px-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5"
            />
          ))}
        </div>
      </div>
    );
  }

  const usernameHint = {
    idle: null,
    checking: <span className="text-[var(--text-muted)]">Kontrol ediliyor...</span>,
    ok: <span className="text-green-500">✓ Kullanılabilir</span>,
    taken: <span className="text-[#e53e3e]">✗ Bu kullanıcı adı alınmış</span>,
    invalid: <span className="text-[#e53e3e]">3-20 karakter, yalnızca a-z, 0-9, _</span>,
  }[usernameStatus];

  return (
    <main className="min-h-screen py-8 pb-36 sm:pb-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="mb-8 border-b border-[var(--border)] pb-5">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Profil Ayarları</h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Profilini düzenle ve herkese açık hale getir
          </p>
        </div>

        <div className="space-y-4">
          {/* Avatar */}
          <div className={sectionClass}>
            <label className={labelClass}>Profil Görseli URL</label>
            <div className="flex items-start gap-4">
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
                  <span className="text-2xl font-semibold text-[#c4a24b]">
                    {profile?.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className={`${inputBase} flex-1`}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Username */}
          <div className={sectionClass}>
            <label className={labelClass}>Kullanıcı Adı</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className={`${inputBase} pl-7`}
                placeholder="kullanici_adi"
                maxLength={20}
              />
            </div>
            {usernameHint && <p className="mt-1.5 text-xs">{usernameHint}</p>}
            {username && (
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                Profil URL: /profile/{username}
              </p>
            )}
          </div>

          {/* Bio */}
          <div className={sectionClass}>
            <div className="mb-2 flex items-center justify-between">
              <label className={labelClass + " mb-0"}>Hakkında</label>
              <span className="text-[10px] text-[var(--text-muted)]">{bio.length}/200</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              rows={3}
              className={inputBase}
              placeholder="Kendinizden kısaca bahsedin..."
            />
          </div>

          {/* Gizlilik */}
          <div className={sectionClass}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Profili Herkese Açık Yap
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Açık olduğunda notlarınız ve profiliniz herkese görünür
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isPublic ? "bg-[#c4a24b]" : "bg-[var(--bg-raised)]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPublic ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ── Mobilde Görünüm & Bildirimler ── */}
          <div className={`${sectionClass} sm:hidden`}>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Uygulama Ayarları
            </p>
            <div className="space-y-3">
              {/* Tema değiştirme */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {theme === "dark" ? "Koyu Tema" : "Açık Tema"}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">Tema geçişi</p>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    theme === "dark" ? "bg-[#c4a24b]" : "bg-[var(--bg-raised)]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      theme === "dark" ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Bildirimler link */}
              <Link
                href="/notifications"
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3.5 py-3 transition-colors hover:border-[#c4a24b]/30"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Bildirimler</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    Bildirimlerini görüntüle
                  </p>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[var(--text-muted)]"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>
          </div>

          {/* ── Verilerini İndir ── */}
          <div className={sectionClass}>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Verilerini İndir
            </p>
            <div className="space-y-2.5">
              <a
                href="/api/users/me/export?format=csv"
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3.5 py-3 transition-colors hover:border-[#c4a24b]/30"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Excel İndir</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    Tüm notlarını CSV formatında indir
                  </p>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[var(--text-muted)]"
                >
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
              </a>
              <a
                href="/api/users/me/export?format=json"
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-raised)] px-3.5 py-3 transition-colors hover:border-[#c4a24b]/30"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">JSON İndir</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    Tüm notlarını JSON formatında indir
                  </p>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[var(--text-muted)]"
                >
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Save Bar */}
      <div className="bg-[var(--bg-header)]/95 fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <p className="text-xs text-[var(--text-muted)]">
            {isPublic ? "Profilin herkese açık" : "Profilin gizli"}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
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
              className="rounded-lg bg-[#c4a24b] px-6 py-2.5 text-sm font-semibold text-[var(--text-on-accent)] transition-all hover:bg-[#d7ba68] disabled:cursor-not-allowed disabled:opacity-40"
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
