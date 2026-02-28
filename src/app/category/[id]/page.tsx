import { Metadata } from "next";
import { getCategoryLabel, normalizeCategory } from "@/lib/categories";
import CategoryPageClient from "./CategoryPageClient";

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
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

export default function CategoryPage({ params }: { params: { id: string } }) {
  return <CategoryPageClient params={params} />;
}
