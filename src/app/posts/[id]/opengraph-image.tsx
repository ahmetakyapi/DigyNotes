import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { getCategoryLabel } from "@/lib/categories";
import { getPostReadAccess } from "@/lib/post-access";
import { buildPostMetadataDescription, truncateText } from "@/lib/metadata";
import { loadBrandFonts, OG } from "@/lib/og-fonts";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

/** Satori can draw JPEG/PNG data URLs but not WebP: fetch the cover and keep it only if supported. */
async function loadCover(src: string | null | undefined) {
  if (!src || !/^https?:\/\//.test(src)) return null;
  try {
    const res = await fetch(src, { headers: { "User-Agent": "DigyNotesOG/1.0" } });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/image\/(jpeg|jpg|png)/.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > 4_000_000) return null;
    return `data:${type.split(";")[0]};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function Mark({ size: s = 64 }: { size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "center",
        width: s,
        height: s,
        borderRadius: s * 0.26,
        background: OG.card,
        border: `1px solid ${OG.border}`,
        paddingTop: s * 0.12,
      }}
    >
      <span style={{ color: OG.bone, fontSize: s * 0.6, fontWeight: 800, letterSpacing: -2 }}>
        D
      </span>
      <span
        style={{
          color: OG.bone,
          fontSize: s * 0.62,
          fontFamily: "Instrument",
          fontStyle: "italic",
        }}
      >
        n
      </span>
      <span
        style={{
          width: s * 0.12,
          height: s * 0.12,
          borderRadius: 99,
          background: OG.lavender,
          marginLeft: 2,
        }}
      />
    </div>
  );
}

async function renderFallbackCard(message: string) {
  const fonts = await loadBrandFonts(message + "DigyNotesDn.(DN)KİŞİSEL NOT DEFTERİN");
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        background: OG.ink,
        padding: "64px 72px",
        fontFamily: "Hanken",
      }}
    >
      <Mark />
      <span style={{ color: OG.bone, fontSize: 84, fontFamily: "Instrument", fontStyle: "italic" }}>
        {message}
      </span>
      <span style={{ color: OG.muted, fontSize: 20, letterSpacing: 4 }}>
        <span style={{ color: OG.lavender, marginRight: 14 }}>(DN)</span>KİŞİSEL NOT DEFTERİN
      </span>
    </div>,
    { ...size, fonts }
  );
}

export default async function PostOpenGraphImage({ params }: { params: { id: string } }) {
  const access = await getPostReadAccess(params.id);

  if (!access.post || !access.canRead) {
    return renderFallbackCard("Bu Not Herkese Açık Değil");
  }

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: {
      title: true,
      image: true,
      excerpt: true,
      content: true,
      category: true,
      creator: true,
      years: true,
      rating: true,
      user: {
        select: {
          name: true,
          username: true,
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!post) {
    return renderFallbackCard("Not Bulunamadı");
  }

  const categoryLabel = getCategoryLabel(post.category);
  const description = truncateText(
    buildPostMetadataDescription({
      excerpt: post.excerpt,
      content: post.content,
      category: categoryLabel,
      creator: post.creator,
      years: post.years,
    }),
    220
  );
  const tagNames = post.tags.map(({ tag }) => tag.name).slice(0, 3);
  const metaItems = [categoryLabel, post.creator, post.years].filter((value): value is string =>
    Boolean(value)
  );
  const authorLabel = post.user?.name || post.creator || "DigyNotes";
  const ratingLabel =
    typeof post.rating === "number" && post.rating > 0 ? `${post.rating.toFixed(1)}/5 puan` : null;

  const cover = await loadCover(post.image);
  const fullStars = Math.floor(post.rating ?? 0);
  const titleSize = post.title.length > 34 ? 64 : post.title.length > 20 ? 80 : 96;
  const fonts = await loadBrandFonts(
    [
      post.title,
      description,
      metaItems.join(" "),
      tagNames.join(" "),
      authorLabel,
      ratingLabel ?? "",
      "(DN)·@#/5 ★☆ DigyNotesDn. KİŞİSEL NOT DEFTERİN",
      post.user?.username ?? "",
      categoryLabel.toLocaleUpperCase("tr-TR"),
    ].join(" ")
  );

  /* LAYOUT: 1200×630 ink card. LEFT: tilted cover (or serif category tile).
     RIGHT: mono meta row → serif-italic title → creator → stars → excerpt → tags + author. */
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: OG.ink,
        padding: "56px 64px",
        gap: 56,
        position: "relative",
        fontFamily: "Hanken",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -300,
          left: -240,
          width: 900,
          height: 900,
          borderRadius: 9999,
          background: "radial-gradient(closest-side, rgba(185,168,255,0.2), rgba(185,168,255,0))",
        }}
      />
      <div style={{ display: "flex", alignItems: "center" }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            width={340}
            height={510}
            style={{
              objectFit: "cover",
              borderRadius: 24,
              border: `1px solid ${OG.border}`,
              transform: "rotate(-3deg)",
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 340,
              height: 510,
              borderRadius: 24,
              background: OG.card,
              border: `1px solid ${OG.border}`,
              color: OG.bone,
              fontSize: 72,
              fontFamily: "Instrument",
              fontStyle: "italic",
            }}
          >
            {categoryLabel}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: OG.muted, fontSize: 18, letterSpacing: 4 }}>
            <span style={{ color: OG.lavender, marginRight: 14 }}>(DN)</span>
            {metaItems.join("  ·  ").toLocaleUpperCase("tr-TR")}
          </span>
          <Mark size={56} />
        </div>

        <span
          style={{
            color: OG.bone,
            fontSize: titleSize,
            fontFamily: "Instrument",
            fontStyle: "italic",
            lineHeight: 0.95,
            letterSpacing: -2,
            marginTop: 36,
          }}
        >
          {post.title}
        </span>

        {ratingLabel && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <svg key={i} width="28" height="28" viewBox="0 0 24 24">
                  <path
                    d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
                    fill={i < fullStars ? OG.lavender : OG.border}
                  />
                </svg>
              ))}
            </div>
            <span style={{ color: OG.bone, fontSize: 22, fontWeight: 500 }}>{ratingLabel}</span>
          </div>
        )}

        <span
          style={{
            color: OG.secondary,
            fontSize: 24,
            fontWeight: 500,
            lineHeight: 1.45,
            marginTop: 22,
          }}
        >
          {truncateText(description, 150)}
        </span>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            borderTop: `1px solid ${OG.border}`,
            paddingTop: 20,
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            {tagNames.map((t) => (
              <span
                key={t}
                style={{
                  color: OG.secondary,
                  fontSize: 18,
                  border: `1px solid ${OG.border}`,
                  borderRadius: 999,
                  padding: "6px 14px",
                }}
              >
                #{t}
              </span>
            ))}
          </div>
          <span style={{ color: OG.bone, fontSize: 20, fontWeight: 500 }}>
            {authorLabel}
            {post.user?.username ? `  ·  @${post.user.username}` : ""}
          </span>
        </div>
      </div>
    </div>,
    { ...size, fonts }
  );
}
