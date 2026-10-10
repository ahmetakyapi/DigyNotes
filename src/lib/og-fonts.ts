import { readFile } from "fs/promises";
import { join } from "path";

/**
 * Brand fonts for next/og (Satori), read from `assets/og-fonts/` (full TTFs, Latin +
 * Latin Extended, ~310 KB together). They used to be fetched from Google Fonts on every
 * render: three CSS + three font round trips made a share card take ~6 s, and WhatsApp
 * drops previews that are slow to arrive. Node runtime only (uses fs); the files are
 * traced into the serverless bundle via `outputFileTracingIncludes` in next.config.
 *
 * Family names: "Sans" = Schibsted Grotesk (500, 800), "Serif" = Newsreader italic.
 */
const FILES = [
  { file: "schibsted-800.ttf", name: "Sans", weight: 800, style: "normal" },
  { file: "schibsted-500.ttf", name: "Sans", weight: 500, style: "normal" },
  { file: "newsreader-italic.ttf", name: "Serif", weight: 400, style: "italic" },
] as const;

type OgFont = {
  name: string;
  data: Buffer;
  weight: 500 | 800 | 400;
  style: "normal" | "italic";
};

let cache: Promise<OgFont[]> | null = null;

export function loadBrandFonts(): Promise<OgFont[]> {
  cache ??= Promise.all(
    FILES.map(async (f) => ({
      name: f.name,
      data: await readFile(join(process.cwd(), "assets", "og-fonts", f.file)),
      weight: f.weight,
      style: f.style,
    }))
  ).catch((err) => {
    cache = null;
    throw err;
  });
  return cache;
}

export const OG = {
  ink: "#0b0b0a",
  card: "#161613",
  border: "#2e2d28",
  bone: "#f2efe8",
  secondary: "#c9c4b8",
  muted: "#8d887e",
  lavender: "#b9a8ff",
} as const;
