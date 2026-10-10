const LETTER_REGEX = /[A-Za-zÇĞİÖŞÜçğıöşü]/;
const LOWER_REGEX = /[a-zçğıöşü]/;
const UPPER_REGEX = /[A-ZÇĞİÖŞÜ]/;

/**
 * Connectors that stay lowercase inside a Title Case heading (owner rule: "ve, ile, da/de,
 * ki stay lowercase"), plus the English ones so "A Knight of the Seven Kingdoms" reads right.
 */
const MINOR_WORDS = new Set([
  "ve", "ile", "da", "de", "ki", "ya", "veya", "mi", "mı", "mu", "mü",
  "a", "an", "and", "at", "by", "for", "in", "of", "on", "or", "the", "to",
]);

/**
 * An all-caps word up to this many letters is an acronym or a logo (HBO, PS5, FC, AION) and
 * is kept as typed. Longer all-caps words inside otherwise normal text are shouting
 * ("İSTANBUL hatırası") and get normalised.
 */
const ACRONYM_MAX_LETTERS = 4;

function normalizeWhitespace(value?: string | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function letterCount(value: string) {
  return Array.from(value).filter((char) => LETTER_REGEX.test(char)).length;
}

function isAllCaps(value: string) {
  return UPPER_REGEX.test(value) && !LOWER_REGEX.test(value);
}

function capitalizeFirstLetter(value: string) {
  const chars = Array.from(value);
  const index = chars.findIndex((char) => LETTER_REGEX.test(char));

  if (index === -1) return value;

  chars[index] = chars[index].toLocaleUpperCase("tr-TR");
  return chars.join("");
}

/** Lowercases a shouted word; keeps acronyms and words with deliberate inner capitals. */
function calmWord(word: string, textHasLowercase: boolean) {
  if (textHasLowercase && isAllCaps(word) && letterCount(word) > ACRONYM_MAX_LETTERS) {
    return word.toLocaleLowerCase("tr-TR");
  }
  return word;
}

function formatTitleWord(word: string, isFirst: boolean, textHasLowercase: boolean) {
  const calmed = calmWord(word, textHasLowercase);
  // Mixed case on purpose (NCSoft, iPhone) or an acronym: leave it alone.
  if (UPPER_REGEX.test(calmed) && LOWER_REGEX.test(calmed.slice(1))) return calmed;
  if (isAllCaps(calmed)) {
    const lowered = calmed.toLocaleLowerCase("tr-TR");
    return !isFirst && MINOR_WORDS.has(lowered) ? lowered : calmed;
  }
  const lowered = calmed.toLocaleLowerCase("tr-TR");
  if (!isFirst && MINOR_WORDS.has(lowered)) return lowered;
  return capitalizeFirstLetter(calmed);
}

/**
 * Title Case for display, without destroying what the author typed: "AION 2", "NCSoft",
 * "D.I.S.C.O." and "Kotor ve Budva" come out unchanged. It used to lowercase every word
 * first, which printed "Aıon 2", "Ncsoft", "D.i.s.c.o." and "Kotor Ve Budva".
 */
export function formatDisplayTitle(value?: string | null) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return "";

  const textHasLowercase = LOWER_REGEX.test(normalized);
  let wordIndex = 0;

  return normalized
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part)) return part;
      const isFirst = wordIndex++ === 0;
      return part
        .split("-")
        .map((segment, i) => formatTitleWord(segment, isFirst || i > 0, textHasLowercase))
        .join("-");
    })
    .join("");
}

/**
 * Capitalises the start of each sentence and calms shouted words, but keeps names and
 * acronyms ("HBO'da", "Wolverine'i", "MMO'lardaki"). It used to lowercase the whole text.
 */
export function formatDisplaySentence(value?: string | null) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return "";

  const textHasLowercase = LOWER_REGEX.test(normalized);
  const calmed = normalized
    .split(/(\s+)/)
    .map((part) => (/^\s+$/.test(part) ? part : calmWord(part, textHasLowercase)))
    .join("");

  let shouldCapitalize = true;
  let result = "";

  for (const char of calmed) {
    if (shouldCapitalize && LETTER_REGEX.test(char)) {
      result += char.toLocaleUpperCase("tr-TR");
      shouldCapitalize = false;
      continue;
    }

    result += char;

    if (/[.!?]/.test(char)) {
      shouldCapitalize = true;
    }
  }

  return result;
}
