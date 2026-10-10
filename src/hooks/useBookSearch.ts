import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { openLibraryService } from "../services/openLibraryService";
import type {
  Book,
  BookSearchParams,
  BookSearchResult,
  BookSortOption,
} from "../type/book";

export interface UseBookSearchOptions {
  initialQuery?: string;
  initialPage?: number;
  limit?: number;
  initialSort?: BookSortOption;
  initialGenre?: string;
  initialAuthor?: string;
  debounceMs?: number;
  enabled?: boolean;
}

export interface UseBookSearchResult {
  books: Book[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  hasMore: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;

  query: string;
  setQuery: (query: string) => void;
  pageNumber: number;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  sort: BookSortOption;
  setSort: (sort: BookSortOption) => void;
  genre: string;
  setGenre: (genre: string) => void;
  author: string;
  setAuthor: (author: string) => void;
  resetFilters: () => void;
  refetch: () => Promise<unknown>;

  availableGenres: string[];
  availableAuthors: string[];
}

export function useBookSearch(
  options: UseBookSearchOptions = {}
): UseBookSearchResult {
  const {
    initialQuery = "",
    initialPage = 1,
    limit = 20,
    initialSort = "relevance",
    initialGenre = "",
    initialAuthor = "",
    debounceMs = 400,
    enabled = true,
  } = options;

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [page, setPage] = useState(initialPage);
  const [sort, setSort] = useState<BookSortOption>(initialSort);
  const [genre, setGenre] = useState(initialGenre);
  const [author, setAuthor] = useState(initialAuthor);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const searchParams = useMemo<BookSearchParams>(() => {
    return {
      query: debouncedQuery.trim() || "book",
      page,
      limit,
      sort,
      genre: genre.trim() || undefined,
      author: author.trim() || undefined,
    };
  }, [debouncedQuery, page, limit, sort, genre, author]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<BookSearchResult, Error>({
    queryKey: [
      "books",
      "search",
      searchParams.query,
      searchParams.page,
      searchParams.limit,
      searchParams.sort,
      searchParams.genre,
      searchParams.author,
    ],
    queryFn: () => openLibraryService.searchBooks(searchParams),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes cache in React Query
    placeholderData: keepPreviousData,
  });

  const books = useMemo(() => data?.books ?? [], [data?.books]);
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasMore = data?.hasMore ?? false;

  const nextPage = useCallback(() => {
    setPage((prev) => (hasMore ? prev + 1 : prev));
  }, [hasMore]);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
  }, []);

  const resetFilters = useCallback(() => {
    setGenre("");
    setAuthor("");
    setSort("relevance");
    setPage(1);
  }, []);

  const availableGenres = useMemo(() => {
    const genresSet = new Set<string>();
    books.forEach((b) => {
      if (b.genre && b.genre !== "General") genresSet.add(b.genre);
      b.subjects?.slice(0, 3).forEach((s) => genresSet.add(s));
    });
    return Array.from(genresSet).slice(0, 15);
  }, [books]);

  const availableAuthors = useMemo(() => {
    const authorsSet = new Set<string>();
    books.forEach((b) => {
      if (b.author && b.author !== "Unknown Author") {
        authorsSet.add(b.author);
      }
    });
    return Array.from(authorsSet).slice(0, 15);
  }, [books]);

  return {
    books,
    total,
    page,
    pageNumber: page,
    totalPages,
    limit,
    hasMore,
    isLoading,
    isFetching,
    isError,
    error,

    query,
    setQuery,
    setPage,
    nextPage,
    prevPage,
    sort,
    setSort,
    genre,
    setGenre,
    author,
    setAuthor,
    resetFilters,
    refetch,

    availableGenres,
    availableAuthors,
  };
}
