import type {
  OpenLibrarySubjectResponse,
  OpenLibraryTrendingResponse,
} from "@/type/openLibrary";
import type {
  Book,
  CategoryBooks,
  CategoryDefinition,
  HomeCatalogData,
} from "../../type/book";
import { type OpenLibraryClient, requestJson } from "./client";
import { mapDocToBook, mapSubjectWorkToBook } from "./mappers";
import { searchBooks } from "./search";

export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { key: "fiction", label: "Fiction" },
  { key: "fantasy", label: "Fantasy" },
  { key: "science_fiction", label: "Science Fiction" },
  { key: "mystery", label: "Mystery" },
  { key: "romance", label: "Romance" },
];

export async function getBooksByCategory(
  client: OpenLibraryClient,
  category: string,
  limit = 10,
): Promise<Book[]> {
  const cleanCategory = category.trim().toLowerCase();
  const subjectUrl = `${client.baseUrl}/subjects/${encodeURIComponent(
    cleanCategory,
  )}.json?limit=${Math.max(1, limit)}`;

  try {
    const data = await requestJson<OpenLibrarySubjectResponse>(
      client,
      subjectUrl,
      subjectUrl,
      (res) => `Error fetching category '${category}' (${res.status})`,
    );

    if (data.works && data.works.length > 0) {
      return data.works.map((work) =>
        mapSubjectWorkToBook(work, data.name || category),
      );
    }
  } catch {
    // do nothing, return fallback
  }

  const searchFallback = await searchBooks(client, {
    query: `subject:${cleanCategory}`,
    limit,
    offset: 0,
  });

  return searchFallback.books;
}

export async function getTrendingBooks(
  client: OpenLibraryClient,
  limit = 10,
): Promise<Book[]> {
  const trendingUrl = `${client.baseUrl}/trending/daily.json?limit=${Math.max(
    1,
    limit,
  )}`;

  try {
    const data = await requestJson<OpenLibraryTrendingResponse>(
      client,
      trendingUrl,
      trendingUrl,
      (res) => `Error fetching trending books (${res.status})`,
    );

    const works = data.works || data.docs || [];
    if (works.length > 0) {
      return works.map((item) =>
        "authors" in item
          ? mapSubjectWorkToBook(item, "Trending")
          : mapDocToBook(item),
      );
    }
  } catch {
    // do nothing, return fallback
  }

  const fallbackResult = await searchBooks(client, {
    query: "bestseller",
    sort: "popularity",
    limit,
    offset: 0,
  });

  return fallbackResult.books;
}

export async function getHomeCatalog(
  client: OpenLibraryClient,
  categories: CategoryDefinition[] = DEFAULT_CATEGORIES,
  limitPerCategory = 10,
): Promise<HomeCatalogData> {
  const homeCacheKey = `home_catalog_${categories
    .map((c) => c.key)
    .join(",")}_${limitPerCategory}`;

  const cached = client.rateLimiter.getCache<HomeCatalogData>(homeCacheKey);
  if (cached !== null) {
    return cached;
  }

  const trending = await getTrendingBooks(client, limitPerCategory);

  const categoryResults: CategoryBooks[] = [];

  for (const cat of categories) {
    try {
      const books = await getBooksByCategory(client, cat.key, limitPerCategory);
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

  client.rateLimiter.setCache(homeCacheKey, homeData, 15 * 60 * 1000);
  return homeData;
}
