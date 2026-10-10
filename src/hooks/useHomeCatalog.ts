import { useQuery } from "@tanstack/react-query";
import {
  DEFAULT_CATEGORIES,
  openLibraryService,
} from "../services/openLibraryService";
import type { CategoryDefinition, HomeCatalogData } from "../type/book";

export interface UseHomeCatalogOptions {
  categories?: CategoryDefinition[];
  limitPerCategory?: number;
  enabled?: boolean;
}

export interface UseHomeCatalogResult {
  data: HomeCatalogData | undefined;
  trending: HomeCatalogData["trending"];
  categories: HomeCatalogData["categories"];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export function useHomeCatalog(
  options: UseHomeCatalogOptions = {}
): UseHomeCatalogResult {
  const {
    categories = DEFAULT_CATEGORIES,
    limitPerCategory = 10,
    enabled = true,
  } = options;

  const categoriesKey = categories.map((c) => c.key).join(",");

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<HomeCatalogData, Error>({
    queryKey: ["books", "homeCatalog", categoriesKey, limitPerCategory],
    queryFn: () =>
      openLibraryService.getHomeCatalog(categories, limitPerCategory),
    enabled,
    staleTime: 15 * 60 * 1000, // 15 minutes cache
    refetchOnWindowFocus: false,
  });

  return {
    data,
    trending: data?.trending ?? [],
    categories: data?.categories ?? [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}
