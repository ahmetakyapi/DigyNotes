import { Suspense } from "react";
import { Metadata } from "next";
import FeedPageClient from "./FeedPageClient";
import FeedLoading from "./loading";

export const metadata: Metadata = {
  title: "Akış",
  description:
    "Takip ettiklerinin ve kendi notların, toplulukta popüler olanlar ve herkese açık en yeni notlar tek akışta.",
};

export default function FeedPage() {
  // useSearchParams (tab) needs a Suspense boundary (ERR-BUILD-003).
  return (
    <Suspense fallback={<FeedLoading />}>
      <FeedPageClient />
    </Suspense>
  );
}
