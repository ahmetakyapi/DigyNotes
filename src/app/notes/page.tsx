import { Metadata } from "next";
import NotesPageClient from "./NotesPageClient";
import { normalizeTagName } from "@/lib/text";
import type { PostsTab } from "@/components/posts-list/posts-list-types";

export const metadata: Metadata = {
  title: "Notlarım",
  description: "Film, dizi, kitap ve daha fazlası hakkındaki notlarım.",
};

const NOTES_TABS: readonly PostsTab[] = ["notlar", "kaydedilenler", "taslaklar", "arsiv"];

/** A repeated param (`?tags=a&tags=b`) arrives as an array; read the first one. */
function firstParam(value?: string | string[]) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default function NotesPage({
  searchParams,
}: {
  searchParams?: {
    q?: string | string[];
    category?: string | string[];
    tags?: string | string[];
    tab?: string | string[];
  };
}) {
  const tagsParam = firstParam(searchParams?.tags);
  const initialTags = tagsParam
    ? tagsParam
        .split(",")
        .map((tag) => normalizeTagName(tag))
        .filter(Boolean)
    : [];
  // Every tab lives in the URL, so a filter change re-renders on the tab the user is on.
  const tab = firstParam(searchParams?.tab);
  const initialTab: PostsTab = (NOTES_TABS as readonly string[]).includes(tab)
    ? (tab as PostsTab)
    : "notlar";

  return (
    <NotesPageClient
      initialCategory={firstParam(searchParams?.category)}
      initialQuery={firstParam(searchParams?.q)}
      initialTab={initialTab}
      initialTags={initialTags}
    />
  );
}
