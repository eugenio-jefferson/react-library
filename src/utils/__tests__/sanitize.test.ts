import {
  sanitizeText,
  sanitizeSearchQuery,
  isSafeHttpUrl,
  isSafeImageSource,
  MAX_SEARCH_QUERY_LENGTH,
} from "../sanitize";

describe("sanitizeText", () => {
  it("trims and collapses whitespace", () => {
    expect(sanitizeText("  hello   world  ")).toBe("hello world");
  });

  it("strips control characters", () => {
    const input = `ab${String.fromCharCode(0)}c${String.fromCharCode(27)}d${String.fromCharCode(127)}e`;
    expect(sanitizeText(input)).toBe("abcde");
  });

  it("strips zero-width characters", () => {
    const input = `a${String.fromCharCode(0x200b)}b${String.fromCharCode(0x200f)}c${String.fromCharCode(0xfeff)}`;
    expect(sanitizeText(input)).toBe("abc");
  });

  it("limits length", () => {
    expect(sanitizeText("x".repeat(600)).length).toBeLessThanOrEqual(500);
  });

  it("honors a custom max length", () => {
    expect(sanitizeText("abcdef", 3)).toBe("abc");
  });
});

describe("sanitizeSearchQuery", () => {
  it("preserves angle brackets (escaped by React at render and encoded in URLs)", () => {
    expect(sanitizeSearchQuery("<script>alert(1)</script>")).toBe(
      "<script>alert(1)</script>",
    );
  });

  it("caps the query length", () => {
    const long = "a".repeat(MAX_SEARCH_QUERY_LENGTH + 50);
    expect(sanitizeSearchQuery(long)).toHaveLength(MAX_SEARCH_QUERY_LENGTH);
  });

  it("trims the query", () => {
    expect(sanitizeSearchQuery("  dune  ")).toBe("dune");
  });
});

describe("isSafeHttpUrl", () => {
  it("accepts https URLs", () => {
    expect(isSafeHttpUrl("https://covers.openlibrary.org/b/id/1-M.jpg")).toBe(
      true,
    );
  });

  it("accepts http URLs", () => {
    expect(isSafeHttpUrl("http://example.com/book.jpg")).toBe(true);
  });

  it("rejects javascript: URLs", () => {
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects data: URLs", () => {
    expect(isSafeHttpUrl("data:text/html,<script>alert(1)</script>")).toBe(
      false,
    );
  });

  it("rejects malformed values", () => {
    expect(isSafeHttpUrl("not a url")).toBe(false);
  });
});

describe("isSafeImageSource", () => {
  it("accepts https image URLs", () => {
    expect(isSafeImageSource("https://example.com/cover.png")).toBe(true);
  });

  it("accepts inline data:image placeholders", () => {
    expect(isSafeImageSource("data:image/svg+xml;utf8,<svg></svg>")).toBe(
      true,
    );
  });

  it("rejects non-image data URLs", () => {
    expect(isSafeImageSource("data:text/html,<script></script>")).toBe(false);
  });

  it("rejects javascript: URLs", () => {
    expect(isSafeImageSource("javascript:alert(1)")).toBe(false);
  });
});
