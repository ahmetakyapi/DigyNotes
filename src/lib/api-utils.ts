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
  const num = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
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
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "width", "height"],
  },
  // Only the classes Quill writes into content (1.3.7 for older notes, 2.x semantic HTML
  // since 2026-10-26). Any other class (app utilities such as `fixed inset-0 z-50`, or
  // Quill UI classes like ql-hidden / ql-ui) could restyle the note page.
  allowedClasses: {
    "*": [
      "ql-align-*",
      "ql-indent-*",
      "ql-size-*",
      "ql-font-*",
      "ql-direction-*",
      "ql-syntax",
      "ql-video",
    ],
  },
  // User links are user-generated content: no ranking credit, no opener or referrer.
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, rel: "nofollow ugc noopener noreferrer" },
    }),
  },
};

/**
 * Quill 2's semantic HTML (react-quill-new's onChange value) writes every space as `&nbsp;`
 * and an empty line as `<p></p>`. Stored as-is, a note would never wrap between words and
 * would lose its blank lines, so both are brought back to what Quill 1 stored: plain spaces
 * and `<p><br /></p>`. Runs on sanitized output, where entities are already decoded.
 */
export function normalizeQuillHtml(html: string): string {
  return html.replace(/\u00a0/g, " ").replace(/<p><\/p>/g, "<p><br /></p>");
}

/**
 * Post içeriğini sanitize eder.
 */
export function sanitizePostContent(html: string): string {
  return normalizeQuillHtml(sanitizeHtml(html || "", POST_SANITIZE_CONFIG));
}
