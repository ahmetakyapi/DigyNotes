import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { getCategoryLabel } from "@/lib/categories";
import { getPostReadAccess } from "@/lib/post-access";
import { buildPostMetadataDescription, truncateText } from "@/lib/metadata";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

function renderFallbackCard(message: string) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(circle at top left, rgba(196,162,75,0.28), transparent 36%), linear-gradient(135deg, #0f1117 0%, #171d2b 56%, #0f1420 100%)",
        color: "#f5f1df",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "auto -80px -120px auto",
          width: 340,
          height: 340,
          borderRadius: 999,
          background: "rgba(196,162,75,0.18)",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          padding: "56px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 72,
              height: 72,
              borderRadius: 24,
              background: "rgba(196,162,75,0.18)",
              border: "1px solid rgba(196,162,75,0.32)",
              alignItems: "center",
              justifyContent: "center",
              color: "#c4a24b",
              fontSize: 36,
            }}
          >
            D
          </div>
          DigyNotes
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            maxWidth: 880,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.04em",
            }}
          >
            {message}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#c7cfde",
            }}
          >
            Film, dizi, kitap ve gezi notlarini tek yerde tut.
          </div>
        </div>
      </div>
    </div>,
    size
  );
}

export default async function PostOpenGraphImage({ params }: { params: { id: string } }) {
  const access = await getPostReadAccess(params.id);

  if (!access.post || !access.canRead) {
    return renderFallbackCard("Bu not herkese acik degil");
  }

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: {
      title: true,
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
    return renderFallbackCard("Not bulunamadı");
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

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(circle at top left, rgba(196,162,75,0.26), transparent 34%), radial-gradient(circle at bottom right, rgba(112,165,255,0.22), transparent 28%), linear-gradient(135deg, #0f1117 0%, #131925 58%, #0b1019 100%)",
        color: "#f7f3e7",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -40,
          width: 320,
          height: 320,
          borderRadius: 999,
          background: "rgba(112,165,255,0.12)",
          border: "1px solid rgba(112,165,255,0.14)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -160,
          left: -40,
          width: 360,
          height: 360,
          borderRadius: 999,
          background: "rgba(196,162,75,0.12)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          padding: "52px 60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 64,
                height: 64,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                color: "#c4a24b",
                background: "rgba(196,162,75,0.16)",
                border: "1px solid rgba(196,162,75,0.28)",
              }}
            >
              D
            </div>
            DigyNotes
          </div>

          {ratingLabel ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 20px",
                borderRadius: 999,
                background: "rgba(247,243,231,0.08)",
                color: "#f7f3e7",
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              {ratingLabel}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            maxWidth: 920,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {metaItems.slice(0, 3).map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 16px",
                  borderRadius: 999,
                  background: "rgba(247,243,231,0.08)",
                  color: "#d7dded",
                  fontSize: 22,
                }}
              >
                {item}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: "-0.05em",
            }}
          >
            {truncateText(post.title, 90)}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#cbd3e1",
              lineHeight: 1.45,
              maxWidth: 980,
            }}
          >
            {description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 20,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "#8d98ab",
              }}
            >
              Not sahibi
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 32,
                fontWeight: 700,
              }}
            >
              {authorLabel}
            </div>
          </div>

          {tagNames.length ? (
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                justifyContent: "flex-end",
                maxWidth: 420,
              }}
            >
              {tagNames.map((tag) => (
                <div
                  key={tag}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: 999,
                    background: "rgba(196,162,75,0.12)",
                    color: "#f1d88a",
                    fontSize: 20,
                    fontWeight: 600,
                  }}
                >
                  #{tag}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    size
  );
}
