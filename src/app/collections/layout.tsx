import { Metadata } from "next";
import { NO_INDEX } from "@/lib/metadata";

/* Collections are only readable signed in (their API is behind the middleware), so
   an anonymous crawler would index an empty shell. */
export const metadata: Metadata = { robots: NO_INDEX };

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
