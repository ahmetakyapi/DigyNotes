import { Metadata } from "next";
import FeedPageClient from "./FeedPageClient";

export const metadata: Metadata = {
  title: "Akış",
  description:
    "Takip ettiğin kişilerin en yeni notlarını kronolojik olarak görüntüle.",
};

export default function FeedPage() {
  return <FeedPageClient />;
}
