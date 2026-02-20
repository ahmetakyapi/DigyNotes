import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PostDetailClient from "./PostDetailClient";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) return { title: "Not Bulunamadı" };

    return {
      title: post.title,
      description: post.excerpt || undefined,
      openGraph: {
        title: post.title,
        description: post.excerpt || undefined,
        type: "article",
        images: post.image
          ? [{ url: post.image, alt: post.title }]
          : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default function PostPage({ params }: { params: { id: string } }) {
  return <PostDetailClient params={params} />;
}
