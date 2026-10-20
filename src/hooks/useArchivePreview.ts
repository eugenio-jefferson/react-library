import { useQuery } from "@tanstack/react-query";
import { openLibraryService } from "../services/openLibraryService";

export interface UseArchivePreviewResult {
  identifier: string | null | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export function useArchivePreview(
  title: string | undefined,
  author: string | undefined,
  enabled: boolean,
): UseArchivePreviewResult {
  const queryTitle = title?.trim();

  const { data, isLoading, isError, error, refetch } = useQuery<
    string | null,
    Error
  >({
    queryKey: ["books", "archivePreview", queryTitle, author ?? null],
    queryFn: () =>
      openLibraryService.searchArchiveIdentifier(
        queryTitle as string,
        author,
      ),
    enabled: enabled && Boolean(queryTitle),
    staleTime: 30 * 60 * 1000,
  });

  return {
    identifier: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
