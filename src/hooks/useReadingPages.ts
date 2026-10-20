import { useQuery } from "@tanstack/react-query";
import { openLibraryService } from "../services/openLibraryService";
import type { ReadingPages } from "../type/reading";

export interface UseReadingPagesResult {
  pages: ReadingPages | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export function useReadingPages(
  iaIdentifier: string | undefined,
): UseReadingPagesResult {
  const identifier = iaIdentifier?.trim();

  const { data, isLoading, isError, error, refetch } = useQuery<
    ReadingPages,
    Error
  >({
    queryKey: ["books", "readingPages", identifier],
    queryFn: () => openLibraryService.getReadingPages(identifier as string),
    enabled: Boolean(identifier),
    staleTime: 30 * 60 * 1000,
  });

  return {
    pages: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
