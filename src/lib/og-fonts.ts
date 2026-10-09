/**
 * Loads brand fonts for next/og (Satori). Satori needs TTF/OTF; Google Fonts serves TTF
 * when the request has no browser user-agent. `text` subsets the font to keep it small.
 * Returns an empty list on any failure so OG images still render with the default font.
 */
async function loadFont(family: string, axis: string, text: string) {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=${family}:${axis}&text=${encodeURIComponent(text)}`
      )
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

export async function loadBrandFonts(text: string) {
  const [sans, sansMed, serif] = await Promise.all([
    loadFont("Hanken+Grotesk", "wght@800", text),
    loadFont("Hanken+Grotesk", "wght@500", text),
    loadFont("Instrument+Serif", "ital@1", text),
  ]);
  return [
    ...(sans
      ? [{ name: "Hanken", data: sans, weight: 800 as const, style: "normal" as const }]
      : []),
    ...(sansMed
      ? [{ name: "Hanken", data: sansMed, weight: 500 as const, style: "normal" as const }]
      : []),
    ...(serif
      ? [{ name: "Instrument", data: serif, weight: 400 as const, style: "italic" as const }]
      : []),
  ];
}

export const OG = {
  ink: "#0b0b0a",
  card: "#161613",
  border: "#282722",
  bone: "#f2efe8",
  secondary: "#a8a399",
  muted: "#77726a",
  lavender: "#b9a8ff",
} as const;
