import Link from "next/link";
import Image from "next/image";
import { Post } from "@/types";
import StarRating from "@/components/StarRating";

const customLoader = ({ src }: { src: string }) => src;

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {posts.length === 0 && (
        <div className="text-center py-24">
          <p className="text-[#4a5568] text-lg mb-3">Henüz not eklenmemiş.</p>
          <Link
            href="/new-post"
            className="text-[#c9a84c] hover:text-[#e0c068] transition-colors text-sm font-medium"
          >
            İlk notu ekle →
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {posts.map((post, index) => (
          <Link key={post.id} href={`/posts/${post.id}`} className="group block">
            <article
              className="flex rounded-xl overflow-hidden bg-[#151b2d] border border-[#252d40]
                         hover:border-[#c9a84c]/40 transition-all duration-300
                         hover:shadow-[0_4px_32px_rgba(201,168,76,0.08)]"
            >
              {/* Cover image */}
              <div
                className="relative flex-shrink-0"
                style={{ width: "38%", minHeight: "220px" }}
              >
                <Image
                  loader={customLoader}
                  src={post.image}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 40vw, 360px"
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  priority={index === 0}
                />
                {/* Fade into card */}
                <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#151b2d] to-transparent" />
              </div>

              {/* Content */}
              <div className="flex flex-col justify-between p-5 sm:p-6 flex-1 min-w-0">
                <div>
                  {/* Category badge + year */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#c9a84c]
                                 border border-[#c9a84c]/30 bg-[#c9a84c]/8 px-2 py-0.5 rounded-sm flex-shrink-0"
                    >
                      {post.category}
                    </span>
                    {post.years && (
                      <span className="text-xs text-[#4a5568]">{post.years}</span>
                    )}
                  </div>

                  {/* Title */}
                  <h2
                    className="text-lg sm:text-xl font-bold text-[#e8eaf6] leading-snug mb-2
                               group-hover:text-[#c9a84c] transition-colors duration-200 line-clamp-2"
                  >
                    {post.title}
                  </h2>

                  {/* Creator */}
                  {post.creator && (
                    <p className="text-sm text-[#8892b0] mb-3">{post.creator}</p>
                  )}

                  {/* Excerpt */}
                  <p className="text-sm text-[#8892b0] leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                {/* Bottom: rating + date */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#252d40]">
                  <StarRating rating={post.rating} size={13} />
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
