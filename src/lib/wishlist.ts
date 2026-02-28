import { Wishlist } from "@prisma/client";

export function serializeWishlistItem(item: Wishlist) {
  return {
    id: item.id,
    category: item.category,
    title: item.title,
    creator: item.creator,
    years: item.years,
    image: item.image,
    excerpt: item.excerpt,
    externalRating: item.externalRating,
    externalId: item.externalId,
    addedAt: item.addedAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
