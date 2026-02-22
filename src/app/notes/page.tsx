import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Post } from "@/types";
import { prisma } from "@/lib/prisma";
import { PostsList } from "@/components/PostsList";

export const metadata: Metadata = {
  title: "Son Yazılar",
  description: "En son eklenen film, dizi ve kitap notları.",
};

async function getPosts(userId: string): Promise<Post[]> {
  try {
    const posts = await prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { tags: { include: { tag: true } } },
    });
    return posts.map((p) => {
      const { tags, ...rest } = p;
      return {
        ...rest,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        tags: tags.map((pt) => pt.tag),
      };
    });
  } catch {
    return [];
  }
}

export default async function NotesPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id ?? "";
  const posts = await getPosts(userId);

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
    <Suspense>
      <PostsList allPosts={posts} />
    </Suspense>
  );
}
