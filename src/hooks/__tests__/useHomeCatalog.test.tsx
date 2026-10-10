import React from "react";
import { jest } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useHomeCatalog } from "../useHomeCatalog";
import { openLibraryService } from "../../services/openLibraryService";
import type { Book, HomeCatalogData } from "../../type/book";

describe("useHomeCatalog", () => {
  let queryClient: QueryClient;

  const generateBooks = (prefix: string, count: number): Book[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${prefix}-${i + 1}`,
      title: `${prefix} Book ${i + 1}`,
      author: `Author ${i + 1}`,
      genre: prefix,
      status: "Available",
      cover_image: `https://covers.openlibrary.org/b/id/${i + 1}-M.jpg`,
    }));
  };

  const sampleHomeData: HomeCatalogData = {
    trending: generateBooks("Trending", 10),
    categories: [
      {
        category: "fiction",
        categoryLabel: "Fiction",
        books: generateBooks("Fiction", 10),
      },
      {
        category: "fantasy",
        categoryLabel: "Fantasy",
        books: generateBooks("Fantasy", 10),
      },
    ],
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

  it("should load trending and category lists with at least 10 books each", async () => {
    jest.spyOn(openLibraryService, "getHomeCatalog").mockResolvedValueOnce(sampleHomeData);

    const { result } = renderHook(() => useHomeCatalog(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.trending).toHaveLength(10);
    expect(result.current.categories).toHaveLength(2);
    expect(result.current.categories[0].books).toHaveLength(10);
    expect(result.current.categories[1].books).toHaveLength(10);
    expect(result.current.isError).toBe(false);
  });

  it("should handle error state when home catalog fetch fails", async () => {
    jest
      .spyOn(openLibraryService, "getHomeCatalog")
      .mockRejectedValueOnce(new Error("API Rate limit exceeded"));

    const { result } = renderHook(() => useHomeCatalog(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("API Rate limit exceeded");
    expect(result.current.trending).toEqual([]);
    expect(result.current.categories).toEqual([]);
  });
});
