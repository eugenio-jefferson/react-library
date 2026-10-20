import { useQuery } from "@tanstack/react-query";
import { wishlistService } from "../services/wishlistService";
import type { BookWishlistStatus } from "../type/wishlist";

export interface UseBookWishlistStatusResult {
  status: BookWishlistStatus | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export function useBookWishlistStatus(
  workId: string | undefined,
  userId: string | null | undefined,
): UseBookWishlistStatusResult {
  const bookId = workId?.trim();
  const queryUserId = userId ?? null;

  const { data, isLoading, isError, error, refetch } = useQuery<
    BookWishlistStatus,
    Error
  >({
    queryKey: ["wishlist-status", bookId, queryUserId],
    queryFn: () =>
      wishlistService.getBookWishlistStatus(bookId as string, queryUserId),
    enabled: Boolean(bookId),
  });

  return {
    status: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
