import type { OpenLibraryServiceConfig } from "@/type/openLibrary";
import type {
  Book,
  BookDetails,
  BookSearchParams,
  BookSearchResult,
  CategoryDefinition,
  HomeCatalogData,
} from "../type/book";
import type { ReadingPages, ReadingSource } from "../type/reading";
import type { RateLimiter } from "./rateLimiter";
import {
  createOpenLibraryClient,
  type OpenLibraryClient,
} from "./openLibrary/client";
import { formatCoverUrl } from "./openLibrary/mappers";
import { searchBooks } from "./openLibrary/search";
import {
  DEFAULT_CATEGORIES,
  getBooksByCategory,
  getHomeCatalog,
  getTrendingBooks,
} from "./openLibrary/catalog";
import { getBookDetails } from "./openLibrary/bookDetails";
import {
  formatReaderUrl,
  getReadingPages,
  getReadingSource,
  searchArchiveIdentifier,
} from "./openLibrary/reading";

export class OpenLibraryService {
  private readonly client: OpenLibraryClient;

  constructor(config: OpenLibraryServiceConfig = {}) {
    this.client = createOpenLibraryClient(config);
  }

  public getRateLimiter(): RateLimiter {
    return this.client.rateLimiter;
  }

  public formatCoverUrl(
    coverId?: number,
    size: "S" | "M" | "L" = "M",
  ): string {
    return formatCoverUrl(coverId, size);
  }

  public searchBooks(params: BookSearchParams = {}): Promise<BookSearchResult> {
    return searchBooks(this.client, params);
  }

  public getBooksByCategory(category: string, limit = 10): Promise<Book[]> {
    return getBooksByCategory(this.client, category, limit);
  }

  public getTrendingBooks(limit = 10): Promise<Book[]> {
    return getTrendingBooks(this.client, limit);
  }

  public getBookDetails(workId: string): Promise<BookDetails> {
    return getBookDetails(this.client, workId);
  }

  public getReadingSource(workId: string): Promise<ReadingSource | null> {
    return getReadingSource(this.client, workId);
  }

  public formatReaderUrl(iaIdentifier: string): string {
    return formatReaderUrl(iaIdentifier);
  }

  public getReadingPages(iaIdentifier: string): Promise<ReadingPages> {
    return getReadingPages(this.client, iaIdentifier);
  }

  public searchArchiveIdentifier(
    title: string,
    author?: string,
  ): Promise<string | null> {
    return searchArchiveIdentifier(this.client, title, author);
  }

  public getHomeCatalog(
    categories: CategoryDefinition[] = DEFAULT_CATEGORIES,
    limitPerCategory = 10,
  ): Promise<HomeCatalogData> {
    return getHomeCatalog(this.client, categories, limitPerCategory);
  }

  public clearCache(): void {
    this.client.rateLimiter.clearCache();
  }
}

export const openLibraryService = new OpenLibraryService();

export { DEFAULT_PLACEHOLDER_COVER } from "./openLibrary/mappers";
export { DEFAULT_CATEGORIES } from "./openLibrary/catalog";
