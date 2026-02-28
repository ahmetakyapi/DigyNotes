const LETTER_REGEX = /[A-Za-zÇĞİÖŞÜçğıöşü]/;

function normalizeWhitespace(value?: string | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function capitalizeFirstLetter(value: string) {
  const chars = Array.from(value);
  const index = chars.findIndex((char) => LETTER_REGEX.test(char));

  if (index === -1) return value;

  chars[index] = chars[index].toLocaleUpperCase("tr-TR");
  return chars.join("");
}

function formatWord(word: string) {
  const chars = Array.from(word);
  const firstLetterIndex = chars.findIndex((char) => LETTER_REGEX.test(char));

  if (firstLetterIndex === -1) return word;

  const lastLetterIndex =
    chars.length - 1 - [...chars].reverse().findIndex((char) => LETTER_REGEX.test(char));

  const leading = chars.slice(0, firstLetterIndex).join("");
  const core = chars.slice(firstLetterIndex, lastLetterIndex + 1).join("");
  const trailing = chars.slice(lastLetterIndex + 1).join("");

  return (
    leading +
    capitalizeFirstLetter(core.toLocaleLowerCase("tr-TR")) +
    trailing.toLocaleLowerCase("tr-TR")
  );
}

export function formatDisplayTitle(value?: string | null) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return "";

  return normalized
    .split(/(\s+)/)
    .map((part) =>
      /\s+/.test(part)
        ? part
        : part
            .split("-")
            .map((segment) => formatWord(segment))
            .join("-")
    )
    .join("");
}

export function formatDisplaySentence(value?: string | null) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return "";

  const lowered = normalized.toLocaleLowerCase("tr-TR");
  let shouldCapitalize = true;
  let result = "";

  for (const char of lowered) {
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
