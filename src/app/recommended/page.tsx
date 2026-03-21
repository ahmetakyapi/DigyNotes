// filepath: /Users/ahmet/Documents/Projects/personal-projects/DigyNotes/src/app/recommended/page.tsx
import { Metadata } from "next";
import RecommendedPageClient from "./RecommendedPageClient";

export const metadata: Metadata = {
  title: "Öneriler",
  description:
    "Notlarındaki etiketlere göre topluluktan eşleşen içerikleri keşfet. Kişiselleştirilmiş öneri motoru.",
};

export default function RecommendedPage() {
  return <RecommendedPageClient />;
}
