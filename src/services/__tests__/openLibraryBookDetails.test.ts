import type { OpenLibraryService } from "../openLibraryService";
import type { RateLimiter } from "../rateLimiter";
import { DEFAULT_PLACEHOLDER_COVER } from "../openLibraryService";
import { createMockResponse, createTestService } from "../openLibrary/testUtils";

describe("OpenLibraryService.getBookDetails", () => {
  let service: OpenLibraryService;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    ({ service, mockFetch, rateLimiter } = createTestService());
  });

  afterEach(() => {
    rateLimiter.reset();
  });

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
      }),
    );

    mockFetch.mockResolvedValueOnce(
      createMockResponse({
        key: "/authors/OL2627546A",
        name: "Robert C. Martin",
      }),
    );

    const details = await service.getBookDetails("OL1001W");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toBe(
      "https://openlibrary.org/works/OL1001W.json",
    );
    expect(mockFetch.mock.calls[1][0]).toBe(
      "https://openlibrary.org/authors/OL2627546A.json",
    );
    expect(details.id).toBe("OL1001W");
    expect(details.title).toBe("Clean Code");
    expect(details.author).toBe("Robert C. Martin");
    expect(details.category).toBe("Software");
    expect(details.description).toBe(
      "A handbook of agile software craftsmanship.",
    );
    expect(details.cover_image).toBe(
      "https://covers.openlibrary.org/b/id/123456-L.jpg",
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
      }),
    );

    const details = await service.getBookDetails("%2Fworks%2FOL1W");

    expect(mockFetch.mock.calls[0][0]).toBe(
      "https://openlibrary.org/works/OL1W.json",
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
      }),
    );

    const details = await service.getBookDetails("OL2W");

    expect(details.description).toBe("A short synopsis.");
    expect(details.author).toBe("Unknown Author");
  });

  it("should throw a descriptive error when the work endpoint fails", async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse(null, {
        ok: false,
        status: 404,
        statusText: "Not Found",
      }),
    );

    await expect(service.getBookDetails("OL404W")).rejects.toThrow(
      "Error fetching book details on Open Library (404: Not Found)",
    );
  });
});
