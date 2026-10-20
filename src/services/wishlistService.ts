import { supabase } from "./supabaseClient";
import type {
  AddBookToWishlistInput,
  BookWishlistStatus,
  Wishlist,
  WishlistItem,
  WishlistWithItems,
} from "../type/wishlist";

interface WishlistRow {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  wishlist_items: Array<{
    id: string;
    wishlist_id: string;
    book_id: string;
    added_at: string;
    books: {
      id: string;
      work_id: string;
      title: string;
      author: string;
      available_copies: number;
    } | null;
  }> | null;
}

export class WishlistService {
  private async requireUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) {
      throw new Error("You must be logged in to manage wish lists.");
    }
    return data.user;
  }

  private validateName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("Wish list name is required.");
    }
    if (trimmed.length > 100) {
      throw new Error("Wish list name must be 100 characters or fewer.");
    }
    return trimmed;
  }

  private async ensureBook({
    id,
    title,
    author,
  }: AddBookToWishlistInput["book"]): Promise<{ id: string }> {
    const { data, error } = await supabase
      .from("books")
      .upsert({ work_id: id, title, author }, { onConflict: "work_id" })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(
        error?.message || "Unable to register this book for the wish list.",
      );
    }

    return { id: data.id as string };
  }

  async getMyWishlists(userId: string): Promise<WishlistWithItems[]> {
    const { data, error } = await supabase
      .from("wishlists")
      .select(
        "*, wishlist_items(*, books(id, work_id, title, author, available_copies))",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as WishlistRow[]).map((row) => {
      const wishlist: Wishlist = {
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        created_at: row.created_at,
      };

      const items: WishlistItem[] = (row.wishlist_items ?? [])
        .flatMap((item) => {
          if (!item.books) return [];
          return [
            {
              id: item.id,
              wishlist_id: item.wishlist_id,
              book_id: item.book_id,
              added_at: item.added_at,
              book: item.books,
            },
          ];
        })
        .sort((a, b) => (a.added_at < b.added_at ? 1 : -1));

      return { wishlist, items };
    });
  }

  async createWishlist(name: string): Promise<Wishlist> {
    const user = await this.requireUser();
    const trimmed = this.validateName(name);

    const { data, error } = await supabase
      .from("wishlists")
      .insert({ user_id: user.id, name: trimmed })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Unable to create the wish list.");
    }

    return data as Wishlist;
  }

  async renameWishlist(
    wishlistId: string,
    name: string,
  ): Promise<Wishlist> {
    const user = await this.requireUser();
    const trimmed = this.validateName(name);

    const { data, error } = await supabase
      .from("wishlists")
      .update({ name: trimmed })
      .eq("id", wishlistId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      if (error?.code === "PGRST116") {
        throw new Error("This wish list was not found.");
      }
      throw new Error(error?.message || "Unable to rename the wish list.");
    }

    return data as Wishlist;
  }

  async deleteWishlist(wishlistId: string): Promise<void> {
    const user = await this.requireUser();

    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("id", wishlistId)
      .eq("user_id", user.id);

    if (error) {
      throw new Error(error.message || "Unable to delete the wish list.");
    }
  }

  async addBookToWishlist({
    wishlistId,
    book,
  }: AddBookToWishlistInput): Promise<WishlistItem> {
    const user = await this.requireUser();

    const { data: wishlist, error: wishlistError } = await supabase
      .from("wishlists")
      .select("id")
      .eq("id", wishlistId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (wishlistError) {
      throw new Error(wishlistError.message);
    }
    if (!wishlist) {
      throw new Error("Wish list not found.");
    }

    const bookRow = await this.ensureBook(book);

    const { data, error } = await supabase
      .from("wishlist_items")
      .insert({ wishlist_id: wishlistId, book_id: bookRow.id })
      .select()
      .single();

    if (error || !data) {
      if (error?.code === "23505") {
        throw new Error("This book is already in that wish list.");
      }
      throw new Error(
        error?.message || "Unable to add this book to the wish list.",
      );
    }

    return data as WishlistItem;
  }

  async removeBookFromWishlist(itemId: string): Promise<void> {
    await this.requireUser();

    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      throw new Error(
        error.message || "Unable to remove this book from the wish list.",
      );
    }
  }

  async getBookWishlistStatus(
    workId: string,
    userId: string | null,
  ): Promise<BookWishlistStatus> {
    const { data: book, error } = await supabase
      .from("books")
      .select("id")
      .eq("work_id", workId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!book || !userId) {
      return { bookId: book?.id ?? null, isInWishlist: false, memberships: [] };
    }

    const { data: wishlists, error: wishlistsError } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", userId);

    if (wishlistsError) {
      throw new Error(wishlistsError.message);
    }

    const wishlistIds = (wishlists ?? []).map((row) => row.id as string);
    if (wishlistIds.length === 0) {
      return { bookId: book.id as string, isInWishlist: false, memberships: [] };
    }

    const { data: items, error: itemsError } = await supabase
      .from("wishlist_items")
      .select("id, wishlist_id")
      .eq("book_id", book.id)
      .in("wishlist_id", wishlistIds);

    if (itemsError) {
      throw new Error(itemsError.message);
    }

    const memberships = (items ?? []).map((item) => ({
      wishlistId: item.wishlist_id as string,
      itemId: item.id as string,
    }));

    return {
      bookId: book.id as string,
      isInWishlist: memberships.length > 0,
      memberships,
    };
  }
}

export const wishlistService = new WishlistService();
