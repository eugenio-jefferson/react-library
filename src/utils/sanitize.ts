const MAX_TEXT_LENGTH = 500;
const MAX_QUERY_LENGTH = 200;

export const MAX_SEARCH_QUERY_LENGTH = MAX_QUERY_LENGTH;

function stripUnsafeChars(input: string): string {
  let out = "";
  for (const ch of input) {
    const code = ch.codePointAt(0) ?? 0;
    if (code <= 0x1f) continue;
    if (code >= 0x7f && code <= 0x9f) continue;
    if (code >= 0x200b && code <= 0x200f) continue;
    if (code === 0x2028 || code === 0x2029 || code === 0xfeff) continue;
    out += ch;
  }
  return out;
}

export function sanitizeText(
  input: string,
  maxLength = MAX_TEXT_LENGTH,
): string {
  return stripUnsafeChars(input)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeSearchQuery(input: string): string {
  return sanitizeText(input, MAX_QUERY_LENGTH);
}

export function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function isSafeImageSource(url: string): boolean {
  if (url.startsWith("data:image/")) return true;
  return isSafeHttpUrl(url);
}
