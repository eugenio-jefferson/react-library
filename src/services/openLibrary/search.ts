import type { OpenLibrarySearchResponse } from "@/type/openLibrary";
import type {
  Book,
  BookSearchParams,
  BookSearchResult,
  BookSortOption,
} from "../../type/book";
import { type OpenLibraryClient, requestJson } from "./client";
import { mapDocToBook } from "./mappers";

function buildSearchUrl(
  client: OpenLibraryClient,
  params: BookSearchParams & { query: string; limit: number; offset: number },
): string {
  const url = new URL(`${client.baseUrl}/search.json`);
  url.searchParams.set("q", params.query);
  url.searchParams.set("limit", String(params.limit));
  url.searchParams.set("offset", String(params.offset));

  url.searchParams.set(
    "fields",
    "key,title,author_name,cover_i,subject,ratings_average,ratings_count,first_publish_year,readinglog_count,edition_count",
  );

  if (params.author) {
    url.searchParams.set("author", params.author);
  }

  if (params.genre) {
    url.searchParams.set("subject", params.genre);
  }

  if (params.sort) {
    const apiSort = mapSortOptionToApi(params.sort);
    if (apiSort) {
      url.searchParams.set("sort", apiSort);
    }
  }

  return url.toString();
}

function mapSortOptionToApi(sort: BookSortOption): string | null {
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

export async function searchBooks(
  client: OpenLibraryClient,
  params: BookSearchParams = {},
): Promise<BookSearchResult> {
  const limit = Math.max(1, params.limit ?? 20);

  let offset = 0;
  if (params.offset !== undefined) {
    offset = Math.max(0, params.offset);
  } else if (params.page !== undefined) {
    offset = Math.max(0, (params.page - 1) * limit);
  }

  const query = params.query?.trim() || "book";
  const searchUrl = buildSearchUrl(client, {
    ...params,
    query,
    limit,
    offset,
  });

  const response = await requestJson<OpenLibrarySearchResponse>(
    client,
    searchUrl,
    searchUrl,
    (res) =>
      `Error searching books on Open Library (${res.status}: ${res.statusText})`,
  );

  let books: Book[] = (response.docs || []).map((doc) => mapDocToBook(doc));

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
        b.subjects?.some((s) => s.toLowerCase().includes(genreLower)),
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
