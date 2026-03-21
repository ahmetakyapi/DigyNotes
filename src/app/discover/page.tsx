import { Metadata } from "next";
import DiscoverPageClient from "./DiscoverPageClient";

export const metadata: Metadata = {
  title: "Keşfet",
  description: "Topluluktaki kullanıcıları keşfet, profillere göz at ve yeni içerikler bul.",
};

export default function DiscoverPage() {
  return <DiscoverPageClient />;
}
