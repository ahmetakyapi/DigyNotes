/**
 * schema.org JSON-LD for public pages (rendered by `src/components/JsonLd.tsx`).
 * Pure builders: callers pass absolute URLs and only publicly visible content.
 */
import { getCategoryLabel, normalizeFixedCategory } from "@/lib/categories";
import { stripHtml, truncateText } from "@/lib/text";

export type JsonLdObject = { [key: string]: unknown };

export const SITE_NAME = "DigyNotes";
export const SITE_DESCRIPTION =
  "Film, dizi, oyun, kitap ve gezi notlarını tut, derecelendir ve kategorilere ayır.";

/**
 * JSON for an inline <script>: `<` is escaped so note text such as "</script>" can't
 * close the tag, plus `>`, `&` and the two JS line separators for good measure.
 */
export function serializeJsonLd(data: JsonLdObject | JsonLdObject[]) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function join(siteUrl: string, path: string) {
  return new URL(path, siteUrl).toString();
}

function isAbsoluteHttpUrl(value: string | null | undefined): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

/** Drops `undefined`/`null`/empty values so the output stays tidy. */
function compact<T extends JsonLdObject>(input: T): T {
  return Object.fromEntries(
    Object.entries(input).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !(Array.isArray(value) && value.length === 0)
    )
  ) as T;
}

export function organizationNode(siteUrl: string): JsonLdObject {
  return {
    "@type": "Organization",
    "@id": join(siteUrl, "/#organization"),
    name: SITE_NAME,
    url: join(siteUrl, "/"),
    logo: {
      "@type": "ImageObject",
      url: join(siteUrl, "/android-chrome-512x512.png"),
      width: 512,
      height: 512,
    },
  };
}

/** Landing: the site and the brand behind it. No SearchAction: there is no public search URL. */
export function buildSiteJsonLd(siteUrl: string): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": join(siteUrl, "/#website"),
        url: join(siteUrl, "/"),
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "tr-TR",
        publisher: { "@id": join(siteUrl, "/#organization") },
      },
      organizationNode(siteUrl),
    ],
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface NoteJsonLdInput {
  id: string;
  title: string;
  category: string;
  excerpt?: string | null;
  content?: string | null;
  creator?: string | null;
  years?: string | null;
  rating: number;
  lat?: number | null;
  lng?: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  tags?: { name: string }[];
  user?: { name: string; username: string | null } | null;
  /** Absolute URL of the note's share card. */
  imageUrl?: string;
}

function toIso(value: Date | string) {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

/** What the note is about, typed by its category. */
export function buildReviewedItem(input: NoteJsonLdInput): JsonLdObject {
  const name = input.title;
  const creator = input.creator?.trim() || undefined;
  const year = input.years?.match(/\d{4}/)?.[0];

  switch (normalizeFixedCategory(input.category)) {
    case "movies":
      return compact({
        "@type": "Movie",
        name,
        director: creator ? { "@type": "Person", name: creator } : undefined,
        dateCreated: year,
      });
    case "series":
      return compact({
        "@type": "TVSeries",
        name,
        creator: creator ? { "@type": "Person", name: creator } : undefined,
        startDate: year,
      });
    case "game":
      // RAWG gives the developer studio here, not a person.
      return compact({
        "@type": "VideoGame",
        name,
        author: creator ? { "@type": "Organization", name: creator } : undefined,
        dateCreated: year,
      });
    case "book":
      return compact({
        "@type": "Book",
        name,
        author: creator ? { "@type": "Person", name: creator } : undefined,
        datePublished: year,
      });
    case "travel": {
      const hasGeo = typeof input.lat === "number" && typeof input.lng === "number";
      return compact({
        "@type": "TouristDestination",
        name,
        geo: hasGeo
          ? { "@type": "GeoCoordinates", latitude: input.lat, longitude: input.lng }
          : undefined,
      });
    }
    default:
      return compact({
        "@type": "CreativeWork",
        name,
        creator: creator ? { "@type": "Person", name: creator } : undefined,
      });
  }
}

/**
 * A public note: a `Review` of the film/book/… when it carries a star rating,
 * otherwise an `Article` about it. Ratings are 0,5–5 in half steps (0 = unrated).
 */
export function buildNoteJsonLd(input: NoteJsonLdInput, siteUrl: string): JsonLdObject {
  const url = join(siteUrl, `/posts/${input.id}`);
  const body = stripHtml(input.content ?? "").trim();
  const summary = truncateText(input.excerpt?.trim() || body, 200);
  const author = input.user
    ? compact({
        "@type": "Person",
        name: input.user.name,
        url: input.user.username
          ? join(siteUrl, `/profile/${encodeURIComponent(input.user.username)}`)
          : undefined,
      })
    : { "@id": join(siteUrl, "/#organization") };
  const keywords = input.tags?.map((tag) => tag.name).join(", ");
  const common = {
    "@context": "https://schema.org",
    "@id": `${url}#note`,
    url,
    mainEntityOfPage: url,
    inLanguage: "tr-TR",
    datePublished: toIso(input.createdAt),
    dateModified: toIso(input.updatedAt),
    author,
    publisher: organizationNode(siteUrl),
    image: input.imageUrl,
    keywords,
  };
  const item = buildReviewedItem(input);

  if (input.rating > 0) {
    return compact({
      ...common,
      "@type": "Review",
      name: input.title,
      description: summary,
      reviewBody: truncateText(body || summary, 5000),
      itemReviewed: item,
      reviewRating: {
        "@type": "Rating",
        ratingValue: input.rating,
        bestRating: 5,
        worstRating: 0.5,
      },
    });
  }

  return compact({
    ...common,
    "@type": "Article",
    headline: truncateText(input.title, 110),
    articleSection: getCategoryLabel(input.category),
    description: summary,
    articleBody: truncateText(body, 5000),
    about: item,
  });
}

export interface ProfileJsonLdInput {
  name: string;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt: Date | string;
  postCount: number;
  followerCount: number;
  followingCount: number;
}

/** A public profile page and the person it belongs to. */
export function buildProfileJsonLd(input: ProfileJsonLdInput, siteUrl: string): JsonLdObject {
  const url = join(siteUrl, `/profile/${encodeURIComponent(input.username)}`);
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": url,
    url,
    inLanguage: "tr-TR",
    dateCreated: toIso(input.createdAt),
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: join(siteUrl, "/") },
    mainEntity: compact({
      "@type": "Person",
      "@id": `${url}#person`,
      name: input.name,
      alternateName: `@${input.username}`,
      identifier: input.username,
      url,
      description: input.bio?.trim() || undefined,
      image: isAbsoluteHttpUrl(input.avatarUrl) ? input.avatarUrl : undefined,
      interactionStatistic: [
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/FollowAction",
          userInteractionCount: input.followerCount,
        },
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/WriteAction",
          userInteractionCount: input.postCount,
        },
      ],
      agentInteractionStatistic: {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/FollowAction",
        userInteractionCount: input.followingCount,
      },
    }),
  };
}
