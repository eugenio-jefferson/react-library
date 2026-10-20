import type { BookDetails } from "./book";

export interface Wishlist {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface WishlistBook {
  id: string;
  work_id: string;
  title: string;
  author: string;
  available_copies: number;
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  book_id: string;
  added_at: string;
  book: WishlistBook;
}

export interface WishlistWithItems {
  wishlist: Wishlist;
  items: WishlistItem[];
}

export interface AddBookToWishlistInput {
  wishlistId: string;
  book: Pick<BookDetails, "id" | "title" | "author">;
}

export interface WishlistMembership {
  wishlistId: string;
  itemId: string;
}

export interface BookWishlistStatus {
  bookId: string | null;
  isInWishlist: boolean;
  memberships: WishlistMembership[];
}
