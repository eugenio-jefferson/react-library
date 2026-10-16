import React from "react";
import { jest } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBookDetails } from "../useBookDetails";
import { openLibraryService } from "../../services/openLibraryService";
import type { BookDetails } from "../../type/book";

describe("useBookDetails", () => {
  let queryClient: QueryClient;

  const sampleBook: BookDetails = {
    id: "OL101W",
    key: "/works/OL101W",
    title: "Clean Architecture",
    author: "Robert C. Martin",
    category: "Architecture",
    description: "A software design approach.",
    cover_image: "https://covers.openlibrary.org/b/id/111-L.jpg",
    subjects: ["Architecture", "Engineering"],
    publish_date: "September 20, 2017",
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

  it("should fetch book details on mount", async () => {
    const detailsSpy = jest
      .spyOn(openLibraryService, "getBookDetails")
      .mockResolvedValueOnce(sampleBook);

    const { result } = renderHook(() => useBookDetails("OL101W"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(detailsSpy).toHaveBeenCalledWith("OL101W");
    expect(result.current.book).toEqual(sampleBook);
    expect(result.current.isError).toBe(false);
  });

  it("should not fetch when id is missing", async () => {
    const detailsSpy = jest.spyOn(openLibraryService, "getBookDetails");

    const { result } = renderHook(() => useBookDetails(undefined), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(detailsSpy).not.toHaveBeenCalled();
    expect(result.current.book).toBeUndefined();
  });

  it("should expose error state when the service fails", async () => {
    jest
      .spyOn(openLibraryService, "getBookDetails")
      .mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useBookDetails("OL999W"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Network error");
    expect(result.current.book).toBeUndefined();
  });
});
