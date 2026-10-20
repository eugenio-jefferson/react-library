import { useQuery } from "@tanstack/react-query";
import { openLibraryService } from "../services/openLibraryService";
import type { ReadingSource } from "../type/reading";

export interface UseReadingSourceResult {
  source: ReadingSource | null | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export function useReadingSource(
  workId: string | undefined,
): UseReadingSourceResult {
  const bookId = workId?.trim();

  const { data, isLoading, isError, error, refetch } = useQuery<
    ReadingSource | null,
    Error
  >({
    queryKey: ["books", "readingSource", bookId],
    queryFn: () => openLibraryService.getReadingSource(bookId as string),
    enabled: Boolean(bookId),
    staleTime: 30 * 60 * 1000,
  });

  return {
    source: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
