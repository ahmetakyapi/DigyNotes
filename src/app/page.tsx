import Link from "next/link";
import Image from "next/image";
import { Post } from "@/types";
import StarRating from "@/components/StarRating";

async function getPosts(): Promise<Post[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/posts`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const posts = await getPosts();
  const [featured, ...rest] = posts;

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-[#151b2d] border border-[#252d40] flex items-center justify-center mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="1.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-[#4a5568] text-base mb-4">Henüz not eklenmemiş.</p>
        <Link
          href="/new-post"
          className="px-5 py-2.5 bg-[#c9a84c] text-[#0f1117] text-sm font-semibold rounded-lg
                     hover:bg-[#e0c068] transition-colors"
        >
          İlk notu ekle
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Section header ── */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-[#e8eaf6] tracking-tight">Son Notlar</h2>
          <div className="h-0.5 w-10 bg-gradient-to-r from-[#c9a84c] to-transparent mt-1.5 rounded-full" />
        </div>
        <span className="text-xs text-[#4a5568]">{posts.length} not</span>
      </div>

      {/* ── Featured card (ilk post, sinematik) ── */}
      {featured && (
        <Link href={`/posts/${featured.id}`} className="group block mb-5">
          <article
            className="relative rounded-2xl overflow-hidden border border-[#252d40]
                       hover:border-[#c9a84c]/50 transition-all duration-500
                       hover:shadow-[0_12px_48px_rgba(201,168,76,0.18)]"
            style={{ minHeight: "340px" }}
          >
            {/* Full-bleed image */}
            <Image
              unoptimized
              src={featured.image}
              alt={featured.title}
              fill
              sizes="(max-width: 768px) 100vw, 896px"
              className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
              priority
            />

            {/* Cinematic gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-[#0f1117]/55 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f1117]/30 to-transparent" />

            {/* "ÖNE ÇIKAN" badge top-left */}
            <div className="absolute top-4 left-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#c9a84c]/80 bg-[#0f1117]/70 border border-[#c9a84c]/25 px-2.5 py-1 rounded-full backdrop-blur-sm">
                Öne Çıkan
              </span>
            </div>

            {/* Text overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <div className="flex items-center gap-2.5 mb-3">
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#0f1117]
                             bg-[#c9a84c] px-2.5 py-1 rounded-sm"
                >
                  {featured.category}
                </span>
                {featured.years && (
                  <span className="text-sm text-[#8892b0]">{featured.years}</span>
                )}
              </div>

              <h2
                className="text-2xl sm:text-3xl font-bold text-[#e8eaf6] leading-tight mb-2
                           group-hover:text-[#c9a84c] transition-colors duration-300"
              >
                {featured.title}
              </h2>

              {featured.creator && (
                <p className="text-sm text-[#8892b0] mb-4">{featured.creator}</p>
              )}

              <div className="flex items-center gap-3">
                <StarRating rating={featured.rating} size={14} />
                {featured.rating > 0 && (
                  <span className="text-xs text-[#4a5568]">{featured.rating}/5</span>
                )}
                <span className="text-xs text-[#4a5568] ml-auto">{featured.date}</span>
              </div>
            </div>
          </article>
        </Link>
      )}

      {/* ── Remaining posts ── */}
      <div className="flex flex-col gap-3">
        {rest.map((post, index) => (
          <Link key={post.id} href={`/posts/${post.id}`} className="group block">
            <article
              className="flex rounded-xl overflow-hidden bg-[#151b2d] border border-[#252d40]
                         hover:border-[#c9a84c]/40 transition-all duration-300
                         hover:shadow-[0_4px_32px_rgba(201,168,76,0.10)]"
            >
              {/* Rank number */}
              <div className="flex-shrink-0 w-10 flex items-center justify-center border-r border-[#252d40]">
                <span className="text-[11px] font-bold text-[#4a5568] tabular-nums
                                 group-hover:text-[#c9a84c]/70 transition-colors">
                  {String(index + 2).padStart(2, "0")}
                </span>
              </div>

              {/* Cover */}
              <div
                className="relative flex-shrink-0"
                style={{ width: "33%", minHeight: "180px" }}
              >
                <Image
                  unoptimized
                  src={post.image}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 35vw, 280px"
                  className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
                />
                <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#151b2d] to-transparent" />
              </div>

              {/* Content */}
              <div className="flex flex-col justify-between p-4 sm:p-5 flex-1 min-w-0">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#c9a84c]
                                 border border-[#c9a84c]/30 px-2 py-0.5 rounded-sm flex-shrink-0"
                    >
                      {post.category}
                    </span>
                    {post.years && (
                      <span className="text-xs text-[#4a5568]">{post.years}</span>
                    )}
                  </div>

                  <h2
                    className="text-base sm:text-lg font-bold text-[#e8eaf6] leading-snug mb-1.5
                               group-hover:text-[#c9a84c] transition-colors duration-200 line-clamp-2"
                  >
                    {post.title}
                  </h2>

                  {post.creator && (
                    <p className="text-sm text-[#8892b0] mb-2">{post.creator}</p>
                  )}

                  <p className="text-sm text-[#8892b0] leading-relaxed line-clamp-2">
                    {post.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#252d40]">
                  <StarRating rating={post.rating} size={12} />
                  <span className="text-xs text-[#4a5568]">{post.date}</span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
