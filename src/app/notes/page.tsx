import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Post } from "@/types";
import { prisma } from "@/lib/prisma";
import { PostsList } from "@/components/PostsList";

export const metadata: Metadata = {
  title: "Notlarım",
  description: "Film, dizi, kitap ve daha fazlası hakkındaki notlarım.",
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)]">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-[var(--text-muted)]"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </div>
        <p className="mb-4 text-base text-[var(--text-muted)]">Henüz not eklenmemiş.</p>
        <Link
          href="/new-post"
          className="rounded-lg bg-[#c4a24b] px-5 py-2.5 text-sm font-semibold text-[#0f1117] transition-colors hover:bg-[#d7ba68]"
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
