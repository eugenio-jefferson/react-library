import type { OpenLibraryDoc, OpenLibrarySearchResponse, OpenLibraryServiceConfig, OpenLibrarySubjectResponse, OpenLibrarySubjectWork, OpenLibraryTrendingResponse } from "@/type/openLibrary";
import type {
  Book,
  BookSearchParams,
  BookSearchResult,
  BookSortOption,
  CategoryBooks,
  CategoryDefinition,
  HomeCatalogData,
} from "../type/book";
import { RateLimiter } from "./rateLimiter";

export const DEFAULT_PLACEHOLDER_COVER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
      <rect width="100%" height="100%" fill="#1e293b"/>
      <rect x="20" y="20" width="260" height="410" fill="none" stroke="#475569" stroke-width="2" stroke-dasharray="6,6" rx="8"/>
      <path d="M120 180h60M120 210h60M120 240h40" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
      <circle cx="150" cy="130" r="24" fill="#334155"/>
      <text x="50%" y="300" font-size="16" fill="#cbd5e1" font-family="system-ui, sans-serif" text-anchor="middle" font-weight="600">No Cover Available</text>
      <text x="50%" y="325" font-size="12" fill="#64748b" font-family="system-ui, sans-serif" text-anchor="middle">Open Library</text>
    </svg>`
  );

export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { key: "fiction", label: "Fiction" },
  { key: "fantasy", label: "Fantasy" },
  { key: "science_fiction", label: "Science Fiction" },
  { key: "mystery", label: "Mystery" },
  { key: "romance", label: "Romance" },
];

let fallbackIdSequence = 0;
function createFallbackId(prefix: string): string {
  fallbackIdSequence += 1;
  return `${prefix}-${fallbackIdSequence}`;
}

export class OpenLibraryService {
  private readonly baseUrl: string;
  private readonly rateLimiter: RateLimiter;
  private readonly fetcher: typeof fetch;

  constructor(config: OpenLibraryServiceConfig = {}) {
    this.baseUrl = config.baseUrl ?? "https://openlibrary.org";
    this.rateLimiter =
      config.rateLimiter ??
      new RateLimiter({
        maxRequests: 3,
        windowMs: 1000,
        defaultTtlMs: 10 * 60 * 1000,
      });
    this.fetcher = config.fetcher ?? ((...args) => fetch(...args));
  }

  public getRateLimiter(): RateLimiter {
    return this.rateLimiter;
  }

  public formatCoverUrl(
    coverId?: number,
    size: "S" | "M" | "L" = "M"
  ): string {
    if (!coverId || coverId <= 0) {
      return DEFAULT_PLACEHOLDER_COVER;
    }
    return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
  }

  public async searchBooks(
    params: BookSearchParams = {}
  ): Promise<BookSearchResult> {
    const limit = Math.max(1, params.limit ?? 20);

    let offset = 0;
    if (params.offset !== undefined) {
      offset = Math.max(0, params.offset);
    } else if (params.page !== undefined) {
      offset = Math.max(0, (params.page - 1) * limit);
    }

    const query = params.query?.trim() || "book";
    const searchUrl = this.buildSearchUrl({
      ...params,
      query,
      limit,
      offset,
    });

    const response = await this.rateLimiter.schedule(async () => {
      const res = await this.fetcher(searchUrl, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(
          `Error searching books on Open Library (${res.status}: ${res.statusText})`
        );
      }

      return (await res.json()) as OpenLibrarySearchResponse;
    }, searchUrl);

    let books = (response.docs || []).map((doc) => this.mapDocToBook(doc));

    if (params.sort === "author") {
      books = [...books].sort((a, b) => a.author.localeCompare(b.author));
    } else if (params.sort === "title") {
      books = [...books].sort((a, b) => a.title.localeCompare(b.title));
    }

    if (params.genre) {
      const genreLower = params.genre.toLowerCase();
      books = books.filter(
        (b) =>
          b.genre.toLowerCase().includes(genreLower) ||
          b.subjects?.some((s) => s.toLowerCase().includes(genreLower))
      );
    }

    const total = response.numFound ?? books.length;
    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const hasMore = offset + books.length < total;

    return {
      books,
      total,
      limit,
      offset,
      page,
      totalPages,
      hasMore,
    };
  }

  public async getBooksByCategory(
    category: string,
    limit = 10
  ): Promise<Book[]> {
    const cleanCategory = category.trim().toLowerCase();
    const subjectUrl = `${this.baseUrl}/subjects/${encodeURIComponent(
      cleanCategory
    )}.json?limit=${Math.max(1, limit)}`;

    try {
      const data = await this.rateLimiter.schedule(async () => {
        const res = await this.fetcher(subjectUrl, {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          throw new Error(
            `Error fetching category '${category}' (${res.status})`
          );
        }

        return (await res.json()) as OpenLibrarySubjectResponse;
      }, subjectUrl);

      if (data.works && data.works.length > 0) {
        return data.works.map((work) =>
          this.mapSubjectWorkToBook(work, data.name || category)
        );
      }
    } catch {
      // do nothing, return fallback
    }
    const searchFallback = await this.searchBooks({
      query: `subject:${cleanCategory}`,
      limit,
      offset: 0,
    });

    return searchFallback.books;
  }

  public async getTrendingBooks(limit = 10): Promise<Book[]> {
    const trendingUrl = `${this.baseUrl}/trending/daily.json?limit=${Math.max(
      1,
      limit
    )}`;

    try {
      const data = await this.rateLimiter.schedule(async () => {
        const res = await this.fetcher(trendingUrl, {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          throw new Error(`Error fetching trending books (${res.status})`);
        }

        return (await res.json()) as OpenLibraryTrendingResponse;
      }, trendingUrl);

      const works = data.works || data.docs || [];
      if (works.length > 0) {
        return works.map((item) =>
          "authors" in item
            ? this.mapSubjectWorkToBook(item, "Trending")
            : this.mapDocToBook(item)
        );
      }
    } catch {
      // do nothing, return fallback
    }
    const fallbackResult = await this.searchBooks({
      query: "bestseller",
      sort: "popularity",
      limit,
      offset: 0,
    });

    return fallbackResult.books;

  }

  public async getHomeCatalog(
    categories: CategoryDefinition[] = DEFAULT_CATEGORIES,
    limitPerCategory = 10
  ): Promise<HomeCatalogData> {
    const homeCacheKey = `home_catalog_${categories
      .map((c) => c.key)
      .join(",")}_${limitPerCategory}`;

    const cached = this.rateLimiter.getCache<HomeCatalogData>(homeCacheKey);
    if (cached !== null) {
      return cached;
    }

    const trending = await this.getTrendingBooks(limitPerCategory);

    const categoryResults: CategoryBooks[] = [];

    for (const cat of categories) {
      try {
        const books = await this.getBooksByCategory(
          cat.key,
          limitPerCategory
        );
        categoryResults.push({
          category: cat.key,
          categoryLabel: cat.label,
          books,
        });
      } catch (err) {
        console.error(`Error loading category ${cat.label}:`, err);
        categoryResults.push({
          category: cat.key,
          categoryLabel: cat.label,
          books: [],
        });
      }
    }

    const homeData: HomeCatalogData = {
      trending,
      categories: categoryResults,
    };

    this.rateLimiter.setCache(homeCacheKey, homeData, 15 * 60 * 1000);
    return homeData;
  }

  public clearCache(): void {
    this.rateLimiter.clearCache();
  }

  private buildSearchUrl(
    params: BookSearchParams & { query: string; limit: number; offset: number }
  ): string {
    const url = new URL(`${this.baseUrl}/search.json`);
    url.searchParams.set("q", params.query);
    url.searchParams.set("limit", String(params.limit));
    url.searchParams.set("offset", String(params.offset));

    url.searchParams.set(
      "fields",
      "key,title,author_name,cover_i,subject,ratings_average,ratings_count,first_publish_year,readinglog_count,edition_count"
    );

    if (params.author) {
      url.searchParams.set("author", params.author);
    }

    if (params.genre) {
      url.searchParams.set("subject", params.genre);
    }

    if (params.sort) {
      const apiSort = this.mapSortOptionToApi(params.sort);
      if (apiSort) {
        url.searchParams.set("sort", apiSort);
      }
    }

    return url.toString();
  }

  private mapSortOptionToApi(sort: BookSortOption): string | null {
    switch (sort) {
      case "popularity":
        return "readinglog";
      case "rating":
        return "rating";
      case "newest":
        return "new";
      case "oldest":
        return "old";
      case "title":
        return "title";
      default:
        return null;
    }
  }

  private mapDocToBook(doc: OpenLibraryDoc): Book {
    const cleanId = doc.key
      ? doc.key.replace("/works/", "")
      : createFallbackId("book");

    const author =
      Array.isArray(doc.author_name) && doc.author_name.length > 0
        ? doc.author_name.join(", ")
        : "Unknown Author";

    const subjects = doc.subject || [];
    const genre = subjects.length > 0 ? subjects[0] : "General";

    return {
      id: cleanId,
      key: doc.key,
      title: doc.title?.trim() || "Untitled",
      author,
      genre,
      status: "Available",
      cover_image: this.formatCoverUrl(doc.cover_i, "M"),
      subjects,
      first_publish_year: doc.first_publish_year,
      ratings_average:
        typeof doc.ratings_average === "number"
          ? Math.round(doc.ratings_average * 10) / 10
          : undefined,
      ratings_count: doc.ratings_count,
      readinglog_count: doc.readinglog_count,
      edition_count: doc.edition_count,
    };
  }

  private mapSubjectWorkToBook(
    work: OpenLibrarySubjectWork,
    defaultGenre: string
  ): Book {
    const cleanId = work.key
      ? work.key.replace("/works/", "")
      : createFallbackId("subject-book");

    let author = "Unknown Author";
    if (work.authors && work.authors.length > 0) {
      author = work.authors.map((a) => a.name).join(", ");
    } else if (work.author_name && work.author_name.length > 0) {
      author = work.author_name.join(", ");
    }

    const coverId = work.cover_id || work.cover_i;
    const subjects = work.subject || [];
    const genre = subjects.length > 0 ? subjects[0] : defaultGenre;

    return {
      id: cleanId,
      key: work.key,
      title: work.title?.trim() || "Untitled",
      author,
      genre,
      status: "Available",
      cover_image: this.formatCoverUrl(coverId, "M"),
      subjects,
      first_publish_year: work.first_publish_year,
      edition_count: work.edition_count,
    };
  }
}

export const openLibraryService = new OpenLibraryService();
