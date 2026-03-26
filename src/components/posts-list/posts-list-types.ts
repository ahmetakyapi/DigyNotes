import type { Post } from "@/types";
import type { SortFilterState } from "@/components/SortFilterBar";

/* ── Props ── */

export type PostsTab = "notlar" | "kaydedilenler" | "taslaklar" | "arsiv";

export interface PostsListProps {
  readonly allPosts: Post[];
  readonly initialActiveCategory?: string;
  readonly initialActiveTab?: PostsTab;
  readonly initialActiveTags?: string[];
  readonly searchQuery?: string;
  readonly savedPosts?: Post[];
  readonly draftPosts?: Post[];
  readonly archivedPosts?: Post[];
  readonly hasMorePosts?: boolean;
  readonly hasMoreSavedPosts?: boolean;
  readonly isLoadingMorePosts?: boolean;
  readonly isLoadingMoreSavedPosts?: boolean;
  readonly onLoadMorePosts?: () => void | Promise<void>;
  readonly onLoadMoreSavedPosts?: () => void | Promise<void>;
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
