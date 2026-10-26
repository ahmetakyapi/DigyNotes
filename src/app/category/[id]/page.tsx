import { Metadata } from "next";
import { getCategoryLabel, normalizeCategory } from "@/lib/categories";
import CategoryPageClient from "./CategoryPageClient";

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const params = await paramsPromise;
  const categoryName = normalizeCategory(decodeURIComponent(params.id));
  const categoryLabel = getCategoryLabel(categoryName);
  return {
    title: categoryLabel,
    description: `${categoryLabel} kategorisindeki notlar.`,
    openGraph: {
      title: `${categoryLabel} | DigyNotes`,
      description: `${categoryLabel} kategorisindeki notlar.`,
    },
  };
}

export default async function CategoryPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = await paramsPromise;
  return <CategoryPageClient params={params} />;
}
