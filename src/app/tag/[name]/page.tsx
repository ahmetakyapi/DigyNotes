import { Metadata } from "next";
import TagPageClient from "./TagPageClient";

export function generateMetadata({ params }: { params: { name: string } }): Metadata {
  const tagName = decodeURIComponent(params.name);
  return {
    title: `#${tagName} — DigyNotes`,
    description: `Toplulukta #${tagName} etiketiyle notlanan içerikler.`,
  };
}

export default function TagPage({ params }: { params: { name: string } }) {
  return <TagPageClient params={params} />;
}
