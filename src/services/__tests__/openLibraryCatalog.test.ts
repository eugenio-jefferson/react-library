import type { OpenLibraryService } from "../openLibraryService";
import type { RateLimiter } from "../rateLimiter";
import type {
  OpenLibrarySubjectResponse,
  OpenLibraryTrendingResponse,
} from "@/type/openLibrary";
import {
  createMockResponse,
  createTestService,
  sampleSearchResponse,
} from "../openLibrary/testUtils";

describe("OpenLibraryService catalog", () => {
  let service: OpenLibraryService;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    ({ service, mockFetch, rateLimiter } = createTestService());
  });

  afterEach(() => {
    rateLimiter.reset();
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
      expect(mockFetch.mock.calls[0][0]).toContain(
        "/subjects/fantasy.json?limit=10",
      );
      expect(books).toHaveLength(1);
      expect(books[0].title).toBe("The Hobbit");
      expect(books[0].author).toBe("J.R.R. Tolkien");
      expect(books[0].cover_image).toBe(
        "https://covers.openlibrary.org/b/id/112233-M.jpg",
      );
    });

    it("should fallback to searchBooks if subjects endpoint fails", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(null, { ok: false, status: 404 }),
      );

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
      expect(mockFetch.mock.calls[0][0]).toContain(
        "/trending/daily.json?limit=10",
      );
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
        }),
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
        }),
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
        }),
      );

      const catalog = await service.getHomeCatalog(
        [
          { key: "fiction", label: "Fiction" },
          { key: "fantasy", label: "Fantasy" },
        ],
        10,
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
        10,
      );
      expect(cachedCatalog).toEqual(catalog);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
