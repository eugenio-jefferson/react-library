import type { OpenLibraryService } from "../openLibraryService";
import type { RateLimiter } from "../rateLimiter";
import { DEFAULT_PLACEHOLDER_COVER } from "../openLibraryService";
import {
  createMockResponse,
  createTestService,
  sampleSearchResponse,
} from "../openLibrary/testUtils";

describe("OpenLibraryService.searchBooks", () => {
  let service: OpenLibraryService;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    ({ service, mockFetch, rateLimiter } = createTestService());
  });

  afterEach(() => {
    rateLimiter.reset();
  });

  it("should fetch default search url /search.json?q=book&limit=20&offset=0", async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(sampleSearchResponse));

    const result = await service.searchBooks();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const requestedUrl = mockFetch.mock.calls[0][0] as string;
    expect(requestedUrl).toContain("/search.json");
    expect(requestedUrl).toContain("q=book");
    expect(requestedUrl).toContain("limit=20");
    expect(requestedUrl).toContain("offset=0");
    expect(requestedUrl).toContain("fields=");

    expect(result.books).toHaveLength(2);
    expect(result.total).toBe(45);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(3);
    expect(result.hasMore).toBe(true);
  });

  it("should map catalog fields correctly with cover image and status", async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(sampleSearchResponse));

    const result = await service.searchBooks();
    const firstBook = result.books[0];

    expect(firstBook.id).toBe("OL1001W");
    expect(firstBook.title).toBe("Clean Code");
    expect(firstBook.author).toBe("Robert C. Martin");
    expect(firstBook.genre).toBe("Software");
    expect(firstBook.status).toBe("Available");
    expect(firstBook.cover_image).toBe(
      "https://covers.openlibrary.org/b/id/123456-M.jpg",
    );
    expect(firstBook.ratings_average).toBe(4.7);
    expect(firstBook.edition_count).toBe(15);
    expect(firstBook.first_publish_year).toBe(2008);
  });

  it("should use placeholder cover when cover_i is missing", async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        numFound: 1,
        start: 0,
        docs: [
          {
            key: "/works/OL9999W",
            title: "Book Without Cover",
            author_name: ["Anonymous"],
          },
        ],
      }),
    );

    const result = await service.searchBooks({ query: "nocover" });
    expect(result.books[0].cover_image).toBe(DEFAULT_PLACEHOLDER_COVER);
    expect(result.books[0].genre).toBe("General");
  });

  it("should handle custom pagination (page, offset, limit)", async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        numFound: 50,
        docs: sampleSearchResponse.docs,
      }),
    );

    const result = await service.searchBooks({
      page: 3,
      limit: 10,
    });

    const requestedUrl = mockFetch.mock.calls[0][0] as string;
    expect(requestedUrl).toContain("limit=10");
    expect(requestedUrl).toContain("offset=20");
    expect(result.page).toBe(3);
    expect(result.totalPages).toBe(5);
  });

  it("should pass sort options to API and sort client-side when requested", async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(sampleSearchResponse));

    await service.searchBooks({ sort: "popularity" });
    expect(mockFetch.mock.calls[0][0]).toContain("sort=readinglog");

    mockFetch.mockResolvedValueOnce(createMockResponse(sampleSearchResponse));

    await service.searchBooks({ sort: "rating" });
    expect(mockFetch.mock.calls[1][0]).toContain("sort=rating");

    mockFetch.mockResolvedValueOnce(createMockResponse(sampleSearchResponse));

    const authorSorted = await service.searchBooks({ sort: "author" });
    expect(authorSorted.books[0].author).toBe("Erich Gamma, Richard Helm");
    expect(authorSorted.books[1].author).toBe("Robert C. Martin");
  });

  it("should filter by genre client-side and pass subject to API", async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(sampleSearchResponse));

    const result = await service.searchBooks({ genre: "Architecture" });
    const requestedUrl = mockFetch.mock.calls[0][0] as string;
    expect(requestedUrl).toContain("subject=Architecture");
    expect(result.books).toHaveLength(1);
    expect(result.books[0].title).toBe("Design Patterns");
  });

  it("should throw a descriptive error on non-ok HTTP status", async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse(null, {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      }),
    );

    await expect(service.searchBooks()).rejects.toThrow(
      "Error searching books on Open Library (500: Internal Server Error)",
    );
  });
});
