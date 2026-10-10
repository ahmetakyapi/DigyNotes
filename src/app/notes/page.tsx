import { Metadata } from "next";
import NotesPageClient from "./NotesPageClient";
import { normalizeTagName } from "@/lib/text";

export const metadata: Metadata = {
  title: "Notlarım",
  description: "Film, dizi, kitap ve daha fazlası hakkındaki notlarım.",
};

export default function NotesPage({
  searchParams,
}: {
  searchParams?: { q?: string; category?: string; tags?: string; tab?: string };
}) {
  const initialTags = searchParams?.tags
    ? searchParams.tags
        .split(",")
        .map((tag) => normalizeTagName(tag))
        .filter(Boolean)
    : [];

  return (
    <NotesPageClient
      initialCategory={searchParams?.category ?? ""}
      initialQuery={searchParams?.q ?? ""}
      initialTab={searchParams?.tab === "kaydedilenler" ? "kaydedilenler" : "notlar"}
      initialTags={initialTags}
    />
  );
}
