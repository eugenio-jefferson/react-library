import React from "react";
import { jest } from "@jest/globals";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBookSearch } from "../useBookSearch";
import { openLibraryService } from "../../services/openLibraryService";
import type { BookSearchResult } from "../../type/book";

describe("useBookSearch", () => {
  let queryClient: QueryClient;

  const sampleResult: BookSearchResult = {
    books: [
      {
        id: "OL101W",
        title: "Clean Architecture",
        author: "Robert C. Martin",
        genre: "Architecture",
        status: "Disponível",
        cover_image: "https://covers.openlibrary.org/b/id/111-M.jpg",
        subjects: ["Architecture", "Engineering"],
      },
      {
        id: "OL102W",
        title: "Refactoring",
        author: "Martin Fowler",
        genre: "Design",
        status: "Disponível",
        cover_image: "https://covers.openlibrary.org/b/id/222-M.jpg",
        subjects: ["Design", "Refactoring"],
      },
    ],
    total: 40,
    limit: 20,
    offset: 0,
    page: 1,
    totalPages: 2,
    hasMore: true,
  };

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("should fetch books on mount with initial params", async () => {
    const searchSpy = jest
      .spyOn(openLibraryService, "searchBooks")
      .mockResolvedValueOnce(sampleResult);

    const { result } = renderHook(() => useBookSearch({ debounceMs: 50 }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.books).toHaveLength(2);
    expect(result.current.total).toBe(40);
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(2);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.availableGenres).toContain("Architecture");
    expect(result.current.availableAuthors).toContain("Robert C. Martin");
    expect(searchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "book",
        page: 1,
        limit: 20,
        sort: "relevance",
      }),
    );
  });

  it("should debounce query updates and reset page to 1", async () => {
    const searchSpy = jest
      .spyOn(openLibraryService, "searchBooks")
      .mockResolvedValue(sampleResult);

    const { result } = renderHook(
      () => useBookSearch({ initialPage: 2, debounceMs: 80 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setQuery("clean");
    });

    expect(result.current.query).toBe("clean");

    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "clean",
          page: 1,
        }),
      );
    });
  });

  it("should handle pagination (setPage, nextPage, prevPage)", async () => {
    jest
      .spyOn(openLibraryService, "searchBooks")
      .mockResolvedValue(sampleResult);

    const { result } = renderHook(() => useBookSearch({ debounceMs: 50 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.page).toBe(2);

    act(() => {
      result.current.prevPage();
    });

    expect(result.current.page).toBe(1);

    act(() => {
      result.current.setPage(3);
    });

    expect(result.current.page).toBe(3);
  });

  it("should update sort option and filter parameters", async () => {
    jest
      .spyOn(openLibraryService, "searchBooks")
      .mockResolvedValue(sampleResult);

    const { result } = renderHook(() => useBookSearch({ debounceMs: 50 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSort("popularity");
      result.current.setGenre("Architecture");
      result.current.setAuthor("Robert C. Martin");
    });

    expect(result.current.sort).toBe("popularity");
    expect(result.current.genre).toBe("Architecture");
    expect(result.current.author).toBe("Robert C. Martin");

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.sort).toBe("relevance");
    expect(result.current.genre).toBe("");
    expect(result.current.author).toBe("");
    expect(result.current.page).toBe(1);
  });

  it("should handle error states when service fails", async () => {
    const errorMsg = "Network error";
    jest
      .spyOn(openLibraryService, "searchBooks")
      .mockRejectedValueOnce(new Error(errorMsg));

    const { result } = renderHook(() => useBookSearch({ debounceMs: 50 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe(errorMsg);
    expect(result.current.books).toEqual([]);
  });
});
