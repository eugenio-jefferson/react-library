import { useQuery } from "@tanstack/react-query";
import { openLibraryService } from "../services/openLibraryService";
import type { BookDetails } from "../type/book";

export interface UseBookDetailsOptions {
  enabled?: boolean;
}

export interface UseBookDetailsResult {
  book: BookDetails | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export function useBookDetails(
  id: string | undefined,
  options: UseBookDetailsOptions = {}
): UseBookDetailsResult {
  const { enabled = true } = options;
  const bookId = id?.trim();

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<BookDetails, Error>({
    queryKey: ["books", "details", bookId],
    queryFn: () => openLibraryService.getBookDetails(bookId as string),
    enabled: enabled && Boolean(bookId),
    staleTime: 10 * 60 * 1000,
  });

  return {
    book: data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}
