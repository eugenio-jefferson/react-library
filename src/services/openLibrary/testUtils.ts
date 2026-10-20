import { jest } from "@jest/globals";
import type { OpenLibrarySearchResponse } from "@/type/openLibrary";
import { OpenLibraryService } from "../openLibraryService";
import { RateLimiter } from "../rateLimiter";

export function createMockResponse(
  data: unknown,
  options: { ok?: boolean; status?: number; statusText?: string } = {},
): Response {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: options.statusText ?? "OK",
    json: async () => data,
  } as unknown as Response;
}

export interface OpenLibraryTestContext {
  service: OpenLibraryService;
  mockFetch: jest.MockedFunction<typeof fetch>;
  rateLimiter: RateLimiter;
}

export function createTestService(): OpenLibraryTestContext {
  const mockFetch = jest.fn() as unknown as jest.MockedFunction<typeof fetch>;
  const rateLimiter = new RateLimiter({
    maxRequests: 10,
    windowMs: 1000,
    defaultTtlMs: 60 * 1000,
  });

  const service = new OpenLibraryService({
    baseUrl: "https://openlibrary.org",
    rateLimiter,
    fetcher: mockFetch,
  });

  return { service, mockFetch, rateLimiter };
}

export const sampleSearchResponse: OpenLibrarySearchResponse = {
  numFound: 45,
  start: 0,
  docs: [
    {
      key: "/works/OL1001W",
      title: "Clean Code",
      author_name: ["Robert C. Martin"],
      cover_i: 123456,
      subject: ["Software", "Computer Science"],
      first_publish_year: 2008,
      ratings_average: 4.67,
      ratings_count: 500,
      readinglog_count: 1200,
      edition_count: 15,
    },
    {
      key: "/works/OL1002W",
      title: "Design Patterns",
      author_name: ["Erich Gamma", "Richard Helm"],
      cover_i: 654321,
      subject: ["Software Architecture"],
      first_publish_year: 1994,
      ratings_average: 4.8,
      ratings_count: 850,
      readinglog_count: 2300,
      edition_count: 25,
    },
  ],
};
