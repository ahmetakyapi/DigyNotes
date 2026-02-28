"use client";

interface PasswordStrengthProps {
  password: string;
}

interface StrengthResult {
  score: number; // 0-4
  label: string;
  color: string;
}

function evaluateStrength(password: string): StrengthResult {
  if (!password) return { score: 0, label: "", color: "transparent" };

  let score = 0;

  // Uzunluk
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (password.length >= 14) score += 1;

  // Karakter çeşitliliği
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Yaygın pattern cezası
  if (/^(123|abc|password|qwerty|111|000)/i.test(password)) score = Math.max(score - 2, 0);

  // 0-4 arası normalize
  const normalizedScore = Math.min(Math.floor((score / 6) * 4), 4);

  const map: Record<number, { label: string; color: string }> = {
    0: { label: "Çok zayıf", color: "#e53e3e" },
    1: { label: "Zayıf", color: "#e57e3e" },
    2: { label: "Orta", color: "#c9a84c" },
    3: { label: "Güçlü", color: "#5dba72" },
    4: { label: "Çok güçlü", color: "#38a169" },
  };

  return { score: normalizedScore, ...map[normalizedScore] };
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, label, color } = evaluateStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      {/* Çubuklar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              background: i <= score - 1 ? color : "var(--border)",
            }}
          />
        ))}
      </div>
      {/* Etiket */}
      <p className="text-[11px] font-medium transition-colors duration-200" style={{ color }}>
        {label}
      </p>
    </div>
  );
}
