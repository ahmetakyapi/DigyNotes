export function customLoader({ src }: { src: string }) {
  return src;
}

/* TMDB and RAWG resize on their CDN; every other host keeps the passthrough loader (ERR-006). */
const TMDB_SIZE_PATTERN = /^(https:\/\/image\.tmdb\.org\/t\/p\/)(w\d+|original)\//;
const TMDB_WIDTHS = [185, 342, 500, 780];
const RAWG_GAMES_PREFIX = "https://media.rawg.io/media/games/";
const RAWG_RESIZE_PREFIX = "https://media.rawg.io/media/resize/";
const RAWG_WIDTHS = [420, 640, 1280]; // the only widths RAWG serves; others redirect

export function isResizableImage(src: string) {
  return TMDB_SIZE_PATTERN.test(src) || src.startsWith(RAWG_GAMES_PREFIX);
}

/**
 * A TMDB or RAWG cover at the smallest CDN size that still covers `width` pixels; any other
 * URL comes back unchanged. TMDB never goes above the stored size (MediaSearch saves w500).
 */
export function resizeImageUrl(src: string, width: number) {
  if (!Number.isFinite(width) || width <= 0) return src;

  const tmdb = TMDB_SIZE_PATTERN.exec(src);
  if (tmdb) {
    const stored = tmdb[2] === "original" ? Infinity : Number(tmdb[2].slice(1));
    const target = TMDB_WIDTHS.find((size) => size >= width) ?? TMDB_WIDTHS[TMDB_WIDTHS.length - 1];
    if (target >= stored) return src;
    return `${tmdb[1]}w${target}/${src.slice(tmdb[0].length)}`;
  }

  if (src.startsWith(RAWG_GAMES_PREFIX)) {
    const target = RAWG_WIDTHS.find((size) => size >= width) ?? RAWG_WIDTHS[RAWG_WIDTHS.length - 1];
    return `${RAWG_RESIZE_PREFIX}${target}/-/games/${src.slice(RAWG_GAMES_PREFIX.length)}`;
  }

  return src;
}

/**
 * next/image loader for list and card covers, so `sizes` picks a small CDN file. In dev, Next
 * warns "does not implement width" for a stored w500 TMDB poster: its 400px probe maps back to
 * w500. That warning is a false positive; smaller slots still get w185/w342.
 */
export function cdnImageLoader({ src, width }: { src: string; width: number }) {
  return resizeImageUrl(src, width);
}
