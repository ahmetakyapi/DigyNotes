"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("E-posta veya şifre hatalı.");
    } else {
      router.push("/notes");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full
                        bg-gradient-radial from-[#c9a84c]/6 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full
                        bg-gradient-radial from-[#4a90e2]/4 to-transparent blur-3xl" />
        <div className="absolute inset-0 opacity-[0.025]"
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/">
            <Image src="/digy-notes-logo.png" alt="DigyNotes" width={240} height={74} className="object-contain" />
          </Link>
        </div>

        <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-8 shadow-2xl shadow-black/60">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#f0ede8] mb-1">Hoş Geldiniz</h1>
            <p className="text-sm text-[#555]">Devam etmek için giriş yapın.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#555] mb-2">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="ornek@mail.com"
                className="w-full px-4 py-3 rounded-xl bg-[#0d0d0d] border border-[#222] text-[#f0ede8]
                           placeholder-[#333] text-sm outline-none transition-all duration-200
                           focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/10"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#555] mb-2">
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
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-[#0d0d0d] border border-[#222] text-[#f0ede8]
                             placeholder-[#333] text-sm outline-none transition-all duration-200
                             focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#888] transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round"/>
                      <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#e53e3e]/8 border border-[#e53e3e]/20 text-[#e53e3e] text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 font-semibold text-sm text-[#0a0a0a] rounded-xl
                         bg-[#c9a84c] hover:bg-[#e0c068] transition-all duration-200
                         shadow-lg shadow-[#c9a84c]/20 hover:shadow-[#c9a84c]/35
                         disabled:opacity-60 disabled:cursor-not-allowed
                         hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.3"/>
                    <path d="M21 12a9 9 0 00-9-9" strokeLinecap="round"/>
                  </svg>
                  Giriş yapılıyor...
                </span>
              ) : "Giriş Yap"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-[#1e1e1e]" />
            <span className="text-xs text-[#333]">veya</span>
            <div className="flex-1 h-px bg-[#1e1e1e]" />
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-[#444]">
            Hesabın yok mu?{" "}
            <Link href="/register" className="text-[#c9a84c] hover:text-[#e0c068] font-medium transition-colors">
              Kayıt Ol
            </Link>
          </p>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-[#333] hover:text-[#555] transition-colors">
            ← Ana sayfaya dön
          </Link>
        </div>
      </div>
    </div>
  );
}
