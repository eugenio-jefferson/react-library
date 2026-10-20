import { useMutation, useQueryClient } from "@tanstack/react-query";
import { wishlistService } from "../services/wishlistService";
import type {
  AddBookToWishlistInput,
  Wishlist,
  WishlistItem,
} from "../type/wishlist";

export function useWishlistActions() {
  const queryClient = useQueryClient();

  const invalidateWishlists = () => {
    queryClient.invalidateQueries({ queryKey: ["wishlists"] });
    queryClient.invalidateQueries({ queryKey: ["wishlist-status"] });
  };

  const createMutation = useMutation<Wishlist, Error, string>({
    mutationFn: (name) => wishlistService.createWishlist(name),
    onSettled: invalidateWishlists,
  });

  const renameMutation = useMutation<
    Wishlist,
    Error,
    { wishlistId: string; name: string }
  >({
    mutationFn: ({ wishlistId, name }) =>
      wishlistService.renameWishlist(wishlistId, name),
    onSettled: invalidateWishlists,
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (wishlistId) => wishlistService.deleteWishlist(wishlistId),
    onSettled: invalidateWishlists,
  });

  const addMutation = useMutation<WishlistItem, Error, AddBookToWishlistInput>({
    mutationFn: (input) => wishlistService.addBookToWishlist(input),
    onSettled: invalidateWishlists,
  });

  const removeMutation = useMutation<void, Error, string>({
    mutationFn: (itemId) => wishlistService.removeBookFromWishlist(itemId),
    onSettled: invalidateWishlists,
  });

  return {
    createWishlist: createMutation.mutate,
    isCreating: createMutation.isPending,
    isErrorCreate: createMutation.isError,
    createError: createMutation.error,
    renameWishlist: renameMutation.mutate,
    isRenaming: renameMutation.isPending,
    isErrorRename: renameMutation.isError,
    renameError: renameMutation.error,
    deleteWishlist: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    isErrorDelete: deleteMutation.isError,
    deleteError: deleteMutation.error,
    addBook: addMutation.mutate,
    isAdding: addMutation.isPending,
    isErrorAdd: addMutation.isError,
    addError: addMutation.error,
    removeBook: removeMutation.mutate,
    isRemoving: removeMutation.isPending,
    isErrorRemove: removeMutation.isError,
    removeError: removeMutation.error,
  };
}
