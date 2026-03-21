/**
 * Ortak API yardımcı fonksiyonları
 * PostTag join tablosunu düz Tag dizisine çevirmek, tarih serialize etmek vb.
 */

// ── Post tag transform ──────────────────────────────────────────────

type PostWithJoinTags = {
  tags: { tag: { id: string; name: string } }[];
} & Record<string, unknown>;

/**
 * PostTag join record'larını düz `Tag[]` dizisine dönüştürür.
 * Tüm API route'larda tekrar eden bu dönüşümü merkezileştirir.
 */
export function transformPostTags<T extends PostWithJoinTags>(post: T) {
  const { tags, ...rest } = post;
  return { ...rest, tags: tags.map((pt) => pt.tag) };
}

// ── Post serialization (Date → ISO string) ──────────────────────────

type PostWithDates = {
  createdAt: Date;
  updatedAt: Date;
  tags: { tag: { id: string; name: string } }[];
  user?: {
    id: string;
    name: string;
    username: string | null;
    avatarUrl: string | null;
  } | null;
} & Record<string, unknown>;

/**
 * Post nesnesini JSON-serializable hale getirir:
 * - `createdAt` / `updatedAt` → ISO string
 * - `tags` → düz Tag dizisi
 */
export function serializePost<T extends PostWithDates>(post: T) {
  const { tags, ...rest } = post;
  return {
    ...rest,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    user: post.user ?? undefined,
    tags: tags.map((entry) => entry.tag),
  };
}

// ── Input validation helpers ────────────────────────────────────────

/**
 * Rating değerini 0–5 aralığında, 0.5 adımlarla sınırlar.
 * Geçersiz input → 0 döner.
 */
export function sanitizeRating(value: unknown): number {
  const num = typeof value === "number" ? value : parseFloat(String(value));
  if (!Number.isFinite(num)) return 0;
  const clamped = Math.max(0, Math.min(5, num));
  return Math.round(clamped * 2) / 2; // 0.5 step
}

/**
 * String alanı max uzunlukla sınırlar. Boşsa null döner.
 */
export function sanitizeStringField(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

/**
 * Zorunlu string alanı kontrol eder.
 * Boşsa veya maxLength'i aşıyorsa null döner.
 */
export function requireStringField(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > maxLength ? null : trimmed;
}

// ── HTML sanitization config ────────────────────────────────────────

import sanitizeHtml from "sanitize-html";

export const POST_SANITIZE_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2"]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ["src", "alt", "width", "height"],
    "*": ["class"],
  },
};

/**
 * Post içeriğini sanitize eder.
 */
export function sanitizePostContent(html: string): string {
  return sanitizeHtml(html || "", POST_SANITIZE_CONFIG);
}
