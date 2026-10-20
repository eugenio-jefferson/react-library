import { useQuery } from "@tanstack/react-query";
import { wishlistService } from "../services/wishlistService";
import type { WishlistWithItems } from "../type/wishlist";

export interface UseWishlistsResult {
  wishlists: WishlistWithItems[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export function useWishlists(
  userId: string | null | undefined = null,
): UseWishlistsResult {
  const { data, isLoading, isError, error, refetch } = useQuery<
    WishlistWithItems[],
    Error
  >({
    queryKey: ["wishlists", userId],
    queryFn: () => wishlistService.getMyWishlists(userId as string),
    enabled: Boolean(userId),
  });

  return {
    wishlists: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
