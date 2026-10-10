import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { getCategoryLabel } from "@/lib/categories";
import { getPostReadAccess } from "@/lib/post-access";
import { stripHtml, truncateText } from "@/lib/metadata";
import { loadBrandFonts, OG } from "@/lib/og-fonts";
import { loadCover, OG_SIZE, toJpegResponse } from "@/lib/og-image";
import { OgGlow, OgStars, OgWordmark, renderOgNotice } from "@/lib/og-parts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = OG_SIZE;
export const contentType = "image/jpeg";
export const alt = "DigyNotes notu";

const COVER = { width: 330, height: 495 } as const;

/* The card is read at phone size: WhatsApp shows it ~330 px wide, i.e. at ~0.28×.
   So nothing on it is smaller than ~26 px, there are at most five things to read
   (category, title, rating, two lines of note, author), and none of it is uppercase. */

export default async function PostOpenGraphImage({ params }: { params: { id: string } }) {
  const access = await getPostReadAccess(params.id);
  if (!access.post || !access.canRead) {
    return renderOgNotice("Bu Not Gizli", "Notu yalnızca sahibi görebilir.");
  }

  const post = await prisma.post.findFirst({
    where: { id: params.id, isDraft: false, isDeleted: false },
    select: {
      title: true,
      image: true,
      excerpt: true,
      content: true,
      category: true,
      creator: true,
      years: true,
      rating: true,
      status: true,
      user: { select: { name: true, username: true, avatarUrl: true } },
    },
  });
  if (!post) return renderOgNotice("Not Bulunamadı", "Bu not silinmiş ya da taşınmış olabilir.");

  const [fonts, cover, avatar] = await Promise.all([
    loadBrandFonts(),
    loadCover(post.image),
    loadCover(post.user?.avatarUrl),
  ]);

  const categoryLabel = getCategoryLabel(post.category);
  const meta = [post.creator, post.years].filter((v): v is string => Boolean(v)).join(" · ");
  const note = truncateText(stripHtml(post.excerpt || post.content || ""), 160);
  const rating = typeof post.rating === "number" && post.rating > 0 ? post.rating : null;
  const author = post.user?.name || post.user?.username || "DigyNotes";
  const title = truncateText(post.title, 56);
  /* The right column is ~560 px wide and ~520 px tall. Serif italic runs ~0.37 em per
     character, so pick the size that keeps short titles on one line, let long ones take
     two, and give the note whatever height is left (two lines, or one). */
  const titleSize = title.length <= 12 ? 104 : title.length <= 15 ? 86 : 70;
  const titleLines = Math.min(2, Math.ceil(title.length / (560 / (titleSize * 0.37))));
  const noteLines = titleLines === 1 ? 2 : 1;

  /* LAYOUT: 1200×630 ink card, 56 px frame.
     LEFT  — the cover, slightly tilted (or a serif category tile when there is none).
     RIGHT — category chip + status · title (serif italic) · creator/year
             · stars + score · two lines of the note · author row with the wordmark. */
  return toJpegResponse(
    new ImageResponse(
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: OG.ink,
          padding: "56px 64px 52px 64px",
          gap: 60,
          position: "relative",
          fontFamily: "Sans",
        }}
      >
        <OgGlow />

        <div style={{ display: "flex", alignItems: "center" }}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              width={COVER.width}
              height={COVER.height}
              style={{
                objectFit: "cover",
                borderRadius: 26,
                border: `2px solid ${OG.border}`,
                transform: "rotate(-3deg)",
                boxShadow: "0 30px 60px rgba(0,0,0,0.55)",
              }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: COVER.width,
                height: COVER.height,
                borderRadius: 26,
                background: OG.card,
                border: `2px solid ${OG.border}`,
                transform: "rotate(-3deg)",
                color: OG.bone,
                fontSize: 76,
                fontFamily: "Serif",
                fontStyle: "italic",
              }}
            >
              {categoryLabel}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{
                display: "flex",
                color: OG.ink,
                background: OG.lavender,
                fontSize: 26,
                fontWeight: 800,
                borderRadius: 999,
                padding: "6px 20px",
              }}
            >
              {categoryLabel}
            </span>
            {post.status && (
              <span style={{ color: OG.secondary, fontSize: 28, fontWeight: 500 }}>
                {post.status}
              </span>
            )}
          </div>

          <span
            style={{
              display: "block",
              lineClamp: 2,
              color: OG.bone,
              fontSize: titleSize,
              fontFamily: "Serif",
              fontStyle: "italic",
              lineHeight: 1.02,
              letterSpacing: -1.5,
              marginTop: 26,
            }}
          >
            {title}
          </span>
          {meta && (
            <span style={{ color: OG.secondary, fontSize: 30, fontWeight: 500, marginTop: 14 }}>
              {meta}
            </span>
          )}

          {rating && (
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24 }}>
              <OgStars value={rating} size={40} />
              <span style={{ color: OG.bone, fontSize: 36, fontWeight: 800 }}>
                {rating.toFixed(1).replace(".", ",")}
              </span>
            </div>
          )}

          {/* Whatever height is left; if the title estimate was off, the note is cut
              here rather than running into the author row. */}
          <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
            {note && (
              <span
                style={{
                  display: "block",
                  lineClamp: noteLines,
                  color: OG.secondary,
                  fontSize: 27,
                  fontWeight: 500,
                  lineHeight: 1.4,
                  marginTop: 22,
                }}
              >
                {note}
              </span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 22,
              borderTop: `2px solid ${OG.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt=""
                  width={52}
                  height={52}
                  style={{ borderRadius: 999, objectFit: "cover" }}
                />
              ) : (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 52,
                    height: 52,
                    borderRadius: 999,
                    background: OG.card,
                    border: `2px solid ${OG.border}`,
                    color: OG.lavender,
                    fontSize: 26,
                    fontWeight: 800,
                  }}
                >
                  {author.charAt(0).toLocaleUpperCase("tr-TR")}
                </span>
              )}
              <span style={{ color: OG.bone, fontSize: 28, fontWeight: 800 }}>{author}</span>
              {post.user?.username && (
                <span style={{ color: OG.muted, fontSize: 26, fontWeight: 500 }}>
                  @{post.user.username}
                </span>
              )}
            </div>
            <OgWordmark size={34} />
          </div>
        </div>
      </div>,
      { ...OG_SIZE, fonts }
    )
  );
}
