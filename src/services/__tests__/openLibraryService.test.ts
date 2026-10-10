import { jest } from "@jest/globals";
import { OpenLibraryService, DEFAULT_PLACEHOLDER_COVER } from "../openLibraryService";
import { RateLimiter } from "../rateLimiter";
import {
  type OpenLibrarySearchResponse,
  type OpenLibrarySubjectResponse,
  type OpenLibraryTrendingResponse,
} from "@/type/openLibrary";

function createMockResponse(
  data: unknown,
  options: { ok?: boolean; status?: number; statusText?: string } = {}
): Response {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: options.statusText ?? "OK",
    json: async () => data,
  } as unknown as Response;
}

describe("OpenLibraryService", () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let service: OpenLibraryService;
  let rateLimiter: RateLimiter;

  const sampleSearchResponse: OpenLibrarySearchResponse = {
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

  beforeEach(() => {
    mockFetch = jest.fn() as unknown as jest.MockedFunction<typeof fetch>;
    rateLimiter = new RateLimiter({
      maxRequests: 10,
      windowMs: 1000,
      defaultTtlMs: 60 * 1000,
    });

    service = new OpenLibraryService({
      baseUrl: "https://openlibrary.org",
      rateLimiter,
      fetcher: mockFetch,
    });
  });

  afterEach(() => {
    rateLimiter.reset();
  });

  describe("searchBooks", () => {
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
      expect(firstBook.cover_image).toBe("https://covers.openlibrary.org/b/id/123456-M.jpg");
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
        })
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
        })
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
        })
      );

      await expect(service.searchBooks()).rejects.toThrow(
        "Error searching books on Open Library (500: Internal Server Error)"
      );
    });
  });

  describe("getBooksByCategory", () => {
    it("should fetch books from /subjects/{category}.json and map works", async () => {
      const subjectResponse: OpenLibrarySubjectResponse = {
        name: "fantasy",
        work_count: 100,
        works: [
          {
            key: "/works/OL201W",
            title: "The Hobbit",
            authors: [{ name: "J.R.R. Tolkien", key: "/authors/OL1A" }],
            cover_id: 112233,
            subject: ["Fantasy", "Adventure"],
            first_publish_year: 1937,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(subjectResponse));

      const books = await service.getBooksByCategory("fantasy", 10);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain("/subjects/fantasy.json?limit=10");
      expect(books).toHaveLength(1);
      expect(books[0].title).toBe("The Hobbit");
      expect(books[0].author).toBe("J.R.R. Tolkien");
      expect(books[0].cover_image).toBe("https://covers.openlibrary.org/b/id/112233-M.jpg");
    });

    it("should fallback to searchBooks if subjects endpoint fails", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(null, { ok: false, status: 404 }));

      mockFetch.mockResolvedValueOnce(createMockResponse(sampleSearchResponse));

      const books = await service.getBooksByCategory("software", 10);
      expect(books).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("getTrendingBooks", () => {
    it("should fetch trending books from /trending/daily.json", async () => {
      const trendingResponse: OpenLibraryTrendingResponse = {
        works: [
          {
            key: "/works/OL301W",
            title: "Atomic Habits",
            authors: [{ name: "James Clear" }],
            cover_id: 445566,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(trendingResponse));

      const trending = await service.getTrendingBooks(10);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain("/trending/daily.json?limit=10");
      expect(trending).toHaveLength(1);
      expect(trending[0].title).toBe("Atomic Habits");
      expect(trending[0].author).toBe("James Clear");
    });
  });

  describe("getHomeCatalog", () => {
    it("should fetch trending and all specified categories with cache support", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          works: [
            {
              key: "/works/OL1W",
              title: "Trending Book",
              authors: [{ name: "Top Author" }],
              cover_id: 111,
            },
          ],
        })
      );

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          name: "fiction",
          works: [
            {
              key: "/works/OL2W",
              title: "Fiction Book",
              authors: [{ name: "Fiction Author" }],
              cover_id: 222,
            },
          ],
        })
      );

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          name: "fantasy",
          works: [
            {
              key: "/works/OL3W",
              title: "Fantasy Book",
              authors: [{ name: "Fantasy Author" }],
              cover_id: 333,
            },
          ],
        })
      );

      const catalog = await service.getHomeCatalog(
        [
          { key: "fiction", label: "Fiction" },
          { key: "fantasy", label: "Fantasy" },
        ],
        10
      );

      expect(catalog.trending).toHaveLength(1);
      expect(catalog.trending[0].title).toBe("Trending Book");
      expect(catalog.categories).toHaveLength(2);
      expect(catalog.categories[0].categoryLabel).toBe("Fiction");
      expect(catalog.categories[0].books[0].title).toBe("Fiction Book");
      expect(catalog.categories[1].categoryLabel).toBe("Fantasy");
      expect(catalog.categories[1].books[0].title).toBe("Fantasy Book");

      const cachedCatalog = await service.getHomeCatalog(
        [
          { key: "fiction", label: "Fiction" },
          { key: "fantasy", label: "Fantasy" },
        ],
        10
      );
      expect(cachedCatalog).toEqual(catalog);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
