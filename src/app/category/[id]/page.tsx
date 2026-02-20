import { Metadata } from "next";
import CategoryPageClient from "./CategoryPageClient";

export function generateMetadata({
  params,
}: {
  params: { id: string };
}): Metadata {
  const categoryName = decodeURIComponent(params.id);
  return {
    title: categoryName,
    description: `${categoryName} kategorisindeki film, dizi ve kitap notları.`,
    openGraph: {
      title: `${categoryName} | DigyNotes`,
      description: `${categoryName} kategorisindeki film, dizi ve kitap notları.`,
    },
  };
}

export default function CategoryPage({ params }: { params: { id: string } }) {
  return <CategoryPageClient params={params} />;
}
