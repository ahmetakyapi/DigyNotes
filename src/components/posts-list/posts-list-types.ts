import type { Post } from "@/types";
import type { SortFilterState } from "@/components/SortFilterBar";

/* ── Props ── */

export type PostsTab = "notlar" | "kaydedilenler" | "taslaklar" | "arsiv";

/** Whole-list numbers from `/api/posts?summary=1`; the loaded pages are only a slice. */
export interface NotesSummary {
  readonly total: number;
  readonly avgRating: number;
  readonly thisMonth: number;
}

export interface PostsListProps {
  readonly allPosts: Post[];
  readonly initialActiveCategory?: string;
  readonly initialActiveTab?: PostsTab;
  readonly initialActiveTags?: string[];
  readonly searchQuery?: string;
  readonly savedPosts?: Post[];
  readonly draftPosts?: Post[];
  readonly archivedPosts?: Post[];
  readonly notesSummary?: NotesSummary | null;
  readonly draftsTotal?: number | null;
  readonly archivedTotal?: number | null;
  readonly hasMorePosts?: boolean;
  readonly hasMoreSavedPosts?: boolean;
  readonly hasMoreDrafts?: boolean;
  readonly hasMoreArchived?: boolean;
  readonly isLoadingMorePosts?: boolean;
  /** The main list is being refetched for new filters (the previous one is still shown). */
  readonly isRefreshingPosts?: boolean;
  readonly isLoadingMoreSavedPosts?: boolean;
  readonly isLoadingMoreDrafts?: boolean;
  readonly isLoadingMoreArchived?: boolean;
  readonly onLoadMorePosts?: () => void | Promise<void>;
  readonly onLoadMoreSavedPosts?: () => void | Promise<void>;
  readonly onLoadMoreDrafts?: () => void | Promise<void>;
  readonly onLoadMoreArchived?: () => void | Promise<void>;
}

export type PostsViewMode = "grid" | "list";

/* ── Sort/filter context passed to sub-components ── */

export interface PostsListContext {
  readonly activeTab: PostsTab;
  readonly activeCategory: string;
  readonly activeTags: string[];
  readonly viewMode: PostsViewMode;
  readonly sortFilter: SortFilterState;
  readonly defaultSortFilter: SortFilterState;
  readonly localQuery: string;
  readonly hasSearch: boolean;
  readonly toggleTag: (name: string) => void;
}

/* ── Helpers ── */

export const POSTS_VIEW_STORAGE_KEY = "dn_posts_view_mode";
