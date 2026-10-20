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

  describe("getBookDetails", () => {
    it("should fetch work details and resolve author names", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          key: "/works/OL1001W",
          title: "Clean Code",
          description: {
            type: "/type/text",
            value: "A handbook of agile software craftsmanship.",
          },
          covers: [123456],
          subjects: ["Software", "Computer Science"],
          authors: [{ author: { key: "/authors/OL2627546A" } }],
          publish_date: "August 1, 2008",
        })
      );

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          key: "/authors/OL2627546A",
          name: "Robert C. Martin",
        })
      );

      const details = await service.getBookDetails("OL1001W");

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[0][0]).toBe(
        "https://openlibrary.org/works/OL1001W.json"
      );
      expect(mockFetch.mock.calls[1][0]).toBe(
        "https://openlibrary.org/authors/OL2627546A.json"
      );
      expect(details.id).toBe("OL1001W");
      expect(details.title).toBe("Clean Code");
      expect(details.author).toBe("Robert C. Martin");
      expect(details.category).toBe("Software");
      expect(details.description).toBe(
        "A handbook of agile software craftsmanship."
      );
      expect(details.cover_image).toBe(
        "https://covers.openlibrary.org/b/id/123456-L.jpg"
      );
      expect(details.subjects).toEqual(["Software", "Computer Science"]);
      expect(details.publish_date).toBe("August 1, 2008");
    });

    it("should normalize work keys passed as /works/OL1W and use placeholder cover when missing", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          key: "/works/OL1W",
          title: "Coverless Book",
          authors: [{ author: { key: "/authors/OL1A", name: "Jane Doe" } }],
        })
      );

      const details = await service.getBookDetails("%2Fworks%2FOL1W");

      expect(mockFetch.mock.calls[0][0]).toBe(
        "https://openlibrary.org/works/OL1W.json"
      );
      expect(details.id).toBe("OL1W");
      expect(details.author).toBe("Jane Doe");
      expect(details.category).toBe("General");
      expect(details.description).toBe("");
      expect(details.cover_image).toBe(DEFAULT_PLACEHOLDER_COVER);
    });

    it("should accept plain string descriptions", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          key: "/works/OL2W",
          title: "Plain Description",
          description: "  A short synopsis.  ",
          authors: [],
        })
      );

      const details = await service.getBookDetails("OL2W");

      expect(details.description).toBe("A short synopsis.");
      expect(details.author).toBe("Unknown Author");
    });

    it("should throw a descriptive error when the work endpoint fails", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(null, { ok: false, status: 404, statusText: "Not Found" })
      );

      await expect(service.getBookDetails("OL404W")).rejects.toThrow(
        "Error fetching book details on Open Library (404: Not Found)"
      );
    });
  });

  describe("getReadingSource", () => {
    it("should return the first edition with an Internet Archive identifier", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          key: "/works/OL66554W",
          entries: [
            { key: "/books/OL1M", title: "Hardcover" },
            { key: "/books/OL2M", title: "Paperback", ocaid: " pride00aust " },
            { key: "/books/OL3M", title: "Folio", ocaid: "pride00aust2" },
          ],
        })
      );

      const source = await service.getReadingSource("OL66554W");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const requestedUrl = mockFetch.mock.calls[0][0] as string;
      expect(requestedUrl).toBe(
        "https://openlibrary.org/works/OL66554W/editions.json?limit=100&fields=key,title,ocaid"
      );
      expect(source).toEqual({
        workId: "OL66554W",
        iaIdentifier: "pride00aust",
        editionKey: "/books/OL2M",
        editionTitle: "Paperback",
      });
    });

    it("should skip book web bundle identifiers when a page-readable scan exists", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          entries: [
            { key: "/books/OL1M", title: "Bundle", ocaid: "bwb_W6-BCM-521" },
            { key: "/books/OL2M", title: "Scan", ocaid: "readable00scan" },
          ],
        })
      );

      const source = await service.getReadingSource("%2Fworks%2FOL66554W");

      const requestedUrl = mockFetch.mock.calls[0][0] as string;
      expect(requestedUrl).toContain("/works/OL66554W/editions.json");
      expect(source?.iaIdentifier).toBe("readable00scan");
      expect(source?.workId).toBe("OL66554W");
    });

    it("should fall back to a bundle identifier when no other scan exists", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          entries: [{ key: "/books/OL1M", ocaid: "bwb_ONLY123" }],
        })
      );

      const source = await service.getReadingSource("OL1W");

      expect(source?.iaIdentifier).toBe("bwb_ONLY123");
      expect(source?.editionTitle).toBeNull();
      expect(source?.editionKey).toBe("/books/OL1M");
    });

    it("should return null when no edition has readable content", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          entries: [
            { key: "/books/OL1M", title: "Print only" },
            { key: "/books/OL2M", ocaid: "   " },
          ],
        })
      );

      await expect(service.getReadingSource("OL2W")).resolves.toBeNull();
    });

    it("should throw a descriptive error when the editions endpoint fails", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(null, { ok: false, status: 404, statusText: "Not Found" })
      );

      await expect(service.getReadingSource("OL404W")).rejects.toThrow(
        "Error fetching editions on Open Library (404: Not Found)"
      );
    });
  });

  describe("formatReaderUrl", () => {
    it("should build the Internet Archive embed url", () => {
      expect(service.formatReaderUrl("prideprejudice00austuoft")).toBe(
        "https://archive.org/embed/prideprejudice00austuoft"
      );
    });
  });

  describe("getReadingPages", () => {
    it("should fetch the IIIF manifest and map every canvas to a sized page image", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          items: [
            {
              label: { none: ["1"] },
              items: [
                {
                  items: [
                    {
                      body: {
                        id: "https://iiif.archive.org/image/iiif/3/book%2Fjp2/full/max/0/default.jpg",
                        service: [
                          {
                            id: "https://iiif.archive.org/image/iiif/3/book%2Fjp2",
                          },
                        ],
                      },
                    },
                  ],
                },
              ],
            },
            {
              label: { none: ["ii"] },
              items: [
                {
                  items: [
                    {
                      body: {
                        id: "https://iiif.archive.org/image/iiif/3/book%2Fjp2/page2/full/max/0/default.jpg",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        })
      );

      const pages = await service.getReadingPages("book00id");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toBe(
        "https://iiif.archive.org/iiif/book00id/manifest.json"
      );
      expect(pages.iaIdentifier).toBe("book00id");
      expect(pages.total).toBe(2);
      expect(pages.pages[0]).toEqual({
        index: 0,
        label: "1",
        imageUrl:
          "https://iiif.archive.org/image/iiif/3/book%2Fjp2/full/1000,/0/default.jpg",
      });
      expect(pages.pages[1].label).toBe("ii");
      expect(pages.pages[1].imageUrl).toBe(
        "https://iiif.archive.org/image/iiif/3/book%2Fjp2/page2/full/1000,/0/default.jpg"
      );
    });

    it("should support v2 manifests with sequences and string labels", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          sequences: [
            {
              canvases: [
                {
                  label: "5",
                  images: [
                    {
                      resource: {
                        "@id":
                          "https://iiif.archive.org/image/iiif/3/legacy%2Fjp2/full/max/0/default.jpg",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        })
      );

      const pages = await service.getReadingPages("legacy00id");

      expect(pages.total).toBe(1);
      expect(pages.pages[0].label).toBe("5");
      expect(pages.pages[0].imageUrl).toBe(
        "https://iiif.archive.org/image/iiif/3/legacy%2Fjp2/full/1000,/0/default.jpg"
      );
    });

    it("should skip canvases without any image and number the remaining ones", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          items: [
            { label: { none: ["1"] } },
            {
              items: [
                {
                  items: [
                    {
                      body: {
                        service: [
                          {
                            id: "https://iiif.archive.org/image/iiif/3/only%2Fjp2",
                          },
                        ],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        })
      );

      const pages = await service.getReadingPages("mixed00id");

      expect(pages.total).toBe(1);
      expect(pages.pages[0].index).toBe(1);
      expect(pages.pages[0].label).toBe("2");
      expect(pages.pages[0].imageUrl).toBe(
        "https://iiif.archive.org/image/iiif/3/only%2Fjp2/full/1000,/0/default.jpg"
      );
    });

    it("should throw when the manifest contains no readable pages", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ items: [] }));

      await expect(service.getReadingPages("empty00id")).rejects.toThrow(
        "No readable pages were found for this book."
      );
    });

    it("should throw a descriptive error when the manifest fetch fails", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(null, { ok: false, status: 504, statusText: "Gateway Timeout" })
      );

      await expect(service.getReadingPages("broken00id")).rejects.toThrow(
        "Error fetching book pages (504: Gateway Timeout)"
      );
    });
  });

  describe("searchArchiveIdentifier", () => {
    it("should search archive.org by title and creator and return the first identifier", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          response: {
            numFound: 12,
            docs: [
              { identifier: "pride-and-prejudice_202606" },
              { identifier: "prideprejudice0000jane" },
            ],
          },
        })
      );

      const identifier = await service.searchArchiveIdentifier(
        "Pride and Prejudice",
        "Jane Austen",
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const requestedUrl = decodeURIComponent(
        mockFetch.mock.calls[0][0] as string,
      );
      expect(requestedUrl).toContain("archive.org/advancedsearch.php");
      expect(requestedUrl).toContain('title:("Pride and Prejudice")');
      expect(requestedUrl).toContain('creator:("Jane Austen")');
      expect(requestedUrl).toContain("mediatype:texts");
      expect(requestedUrl).toContain("rows=5");
      expect(identifier).toBe("pride-and-prejudice_202606");
    });

    it("should omit the creator clause for unknown or missing authors", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ response: { docs: [{ identifier: "only00id" }] } })
      );

      const identifier = await service.searchArchiveIdentifier(
        "Some Book",
        "Unknown Author",
      );

      const requestedUrl = decodeURIComponent(
        mockFetch.mock.calls[0][0] as string,
      );
      expect(requestedUrl).not.toContain("creator:");
      expect(identifier).toBe("only00id");
    });

    it("should return null when archive.org finds nothing", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ response: { numFound: 0, docs: [] } })
      );

      await expect(
        service.searchArchiveIdentifier("Totally Fake Book 123"),
      ).resolves.toBeNull();
    });

    it("should return null without calling the API when the title is empty", async () => {
      const identifier = await service.searchArchiveIdentifier("   ");

      expect(identifier).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should throw a descriptive error when the archive search fails", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(null, { ok: false, status: 500, statusText: "Server Error" })
      );

      await expect(
        service.searchArchiveIdentifier("Some Book", "Jane Doe"),
      ).rejects.toThrow("Error searching archive.org (500: Server Error)");
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
