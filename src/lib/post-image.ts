export const DEFAULT_POST_IMAGE = "/default-post-cover.svg";

export function getPostImageSrc(image?: string | null) {
  const normalized = image?.trim();
  return normalized ? normalized : DEFAULT_POST_IMAGE;
}
