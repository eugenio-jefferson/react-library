import type { OpenLibraryService } from "../openLibraryService";
import type { RateLimiter } from "../rateLimiter";
import { createMockResponse, createTestService } from "../openLibrary/testUtils";

describe("OpenLibraryService reading", () => {
  let service: OpenLibraryService;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    ({ service, mockFetch, rateLimiter } = createTestService());
  });

  afterEach(() => {
    rateLimiter.reset();
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
        }),
      );

      const source = await service.getReadingSource("OL66554W");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const requestedUrl = mockFetch.mock.calls[0][0] as string;
      expect(requestedUrl).toBe(
        "https://openlibrary.org/works/OL66554W/editions.json?limit=100&fields=key,title,ocaid",
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
        }),
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
        }),
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
        }),
      );

      await expect(service.getReadingSource("OL2W")).resolves.toBeNull();
    });

    it("should throw a descriptive error when the editions endpoint fails", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(null, {
          ok: false,
          status: 404,
          statusText: "Not Found",
        }),
      );

      await expect(service.getReadingSource("OL404W")).rejects.toThrow(
        "Error fetching editions on Open Library (404: Not Found)",
      );
    });
  });

  describe("formatReaderUrl", () => {
    it("should build the Internet Archive embed url", () => {
      expect(service.formatReaderUrl("prideprejudice00austuoft")).toBe(
        "https://archive.org/embed/prideprejudice00austuoft",
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
        }),
      );

      const pages = await service.getReadingPages("book00id");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toBe(
        "https://iiif.archive.org/iiif/book00id/manifest.json",
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
        "https://iiif.archive.org/image/iiif/3/book%2Fjp2/page2/full/1000,/0/default.jpg",
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
        }),
      );

      const pages = await service.getReadingPages("legacy00id");

      expect(pages.total).toBe(1);
      expect(pages.pages[0].label).toBe("5");
      expect(pages.pages[0].imageUrl).toBe(
        "https://iiif.archive.org/image/iiif/3/legacy%2Fjp2/full/1000,/0/default.jpg",
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
        }),
      );

      const pages = await service.getReadingPages("mixed00id");

      expect(pages.total).toBe(1);
      expect(pages.pages[0].index).toBe(1);
      expect(pages.pages[0].label).toBe("2");
      expect(pages.pages[0].imageUrl).toBe(
        "https://iiif.archive.org/image/iiif/3/only%2Fjp2/full/1000,/0/default.jpg",
      );
    });

    it("should throw when the manifest contains no readable pages", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ items: [] }));

      await expect(service.getReadingPages("empty00id")).rejects.toThrow(
        "No readable pages were found for this book.",
      );
    });

    it("should throw a descriptive error when the manifest fetch fails", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse(null, {
          ok: false,
          status: 504,
          statusText: "Gateway Timeout",
        }),
      );

      await expect(service.getReadingPages("broken00id")).rejects.toThrow(
        "Error fetching book pages (504: Gateway Timeout)",
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
        }),
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
        createMockResponse({ response: { docs: [{ identifier: "only00id" }] } }),
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
        createMockResponse({ response: { numFound: 0, docs: [] } }),
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
        createMockResponse(null, {
          ok: false,
          status: 500,
          statusText: "Server Error",
        }),
      );

      await expect(
        service.searchArchiveIdentifier("Some Book", "Jane Doe"),
      ).rejects.toThrow("Error searching archive.org (500: Server Error)");
    });
  });
});
