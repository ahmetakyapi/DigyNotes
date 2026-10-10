import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { truncateText } from "@/lib/metadata";
import { loadBrandFonts, OG } from "@/lib/og-fonts";
import { loadCover, OG_SIZE, toJpegResponse } from "@/lib/og-image";
import { OgGlow, OgWordmark, renderOgNotice } from "@/lib/og-parts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = OG_SIZE;
export const contentType = "image/jpeg";
export const alt = "DigyNotes profili";

const POSTER = { width: 200, height: 300 } as const;
/* Fanned covers on the right: x offset, y offset, rotation. Last one sits on top. */
const FAN = [
  { x: 0, y: 70, r: -9 },
  { x: 110, y: 30, r: -3 },
  { x: 220, y: 50, r: 4 },
  { x: 330, y: 90, r: 10 },
] as const;

export default async function ProfileOpenGraphImage({ params }: { params: { username: string } }) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: { id: true, name: true, username: true, bio: true, avatarUrl: true, isPublic: true },
  });
  if (!user) return renderOgNotice("Profil Bulunamadı", "Bu kullanıcı adıyla bir hesap yok.");
  if (!user.isPublic) {
    return renderOgNotice(
      "Bu Profil Gizli",
      `@${user.username} notlarını yalnızca kendine tutuyor.`
    );
  }

  const visible = { userId: user.id, isDraft: false, isDeleted: false };
  const [noteCount, followers, recent] = await Promise.all([
    prisma.post.count({ where: visible }),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.post.findMany({
      where: { ...visible, image: { not: "" } },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { image: true },
    }),
  ]);

  const [fonts, avatar, ...covers] = await Promise.all([
    loadBrandFonts(),
    loadCover(user.avatarUrl, 120, 120),
    ...recent.map((p) => loadCover(p.image, POSTER.width, POSTER.height)),
  ]);
  const posters = covers.filter((c): c is string => Boolean(c)).slice(0, FAN.length);
  const bio = user.bio ? truncateText(user.bio, 90) : null;
  const stats = [
    `${noteCount.toLocaleString("tr-TR")} not`,
    `${followers.toLocaleString("tr-TR")} takipçi`,
  ];

  /* LAYOUT: 1200×630 ink card.
     LEFT  — avatar, name (serif italic), @username, one line of bio, stats, wordmark.
     RIGHT — up to four of their latest covers fanned out, bleeding off the bottom edge. */
  return toJpegResponse(
    new ImageResponse(
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: OG.ink,
          padding: "60px 64px",
          position: "relative",
          fontFamily: "Sans",
          overflow: "hidden",
        }}
      >
        <OgGlow />

        <div style={{ display: "flex", flexDirection: "column", width: 560 }}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt=""
              width={112}
              height={112}
              style={{ borderRadius: 999, objectFit: "cover", border: `3px solid ${OG.border}` }}
            />
          ) : (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 112,
                height: 112,
                borderRadius: 999,
                background: OG.card,
                border: `3px solid ${OG.border}`,
                color: OG.lavender,
                fontSize: 52,
                fontWeight: 800,
              }}
            >
              {user.name.charAt(0).toLocaleUpperCase("tr-TR")}
            </span>
          )}

          <span
            style={{
              color: OG.bone,
              fontSize: user.name.length > 18 ? 68 : 84,
              fontFamily: "Serif",
              fontStyle: "italic",
              lineHeight: 1.02,
              letterSpacing: -1.5,
              marginTop: 28,
            }}
          >
            {truncateText(user.name, 32)}
          </span>
          <span style={{ color: OG.lavender, fontSize: 32, fontWeight: 500, marginTop: 8 }}>
            @{user.username}
          </span>
          {bio && (
            <span
              style={{
                color: OG.secondary,
                fontSize: 28,
                fontWeight: 500,
                lineHeight: 1.4,
                marginTop: 18,
              }}
            >
              {bio}
            </span>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "auto",
              paddingTop: 22,
              borderTop: `2px solid ${OG.border}`,
            }}
          >
            <div style={{ display: "flex", gap: 22 }}>
              {stats.map((s) => (
                <span key={s} style={{ color: OG.bone, fontSize: 28, fontWeight: 800 }}>
                  {s}
                </span>
              ))}
            </div>
            <OgWordmark size={32} />
          </div>
        </div>

        <div style={{ display: "flex", position: "relative", flex: 1, marginLeft: 20 }}>
          {posters.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              width={POSTER.width}
              height={POSTER.height}
              style={{
                position: "absolute",
                left: FAN[i].x - 20,
                top: FAN[i].y + 60,
                objectFit: "cover",
                borderRadius: 20,
                border: `2px solid ${OG.border}`,
                transform: `rotate(${FAN[i].r}deg)`,
                boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
              }}
            />
          ))}
          {posters.length === 0 && (
            <span
              style={{
                display: "flex",
                alignSelf: "center",
                marginLeft: 60,
                color: OG.muted,
                fontSize: 64,
                fontFamily: "Serif",
                fontStyle: "italic",
              }}
            >
              Not Defteri
            </span>
          )}
        </div>
      </div>,
      { ...OG_SIZE, fonts }
    )
  );
}
