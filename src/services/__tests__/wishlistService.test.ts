import { jest } from "@jest/globals";
import { AuthError, type User } from "@supabase/supabase-js";
import { WishlistService } from "../wishlistService";
import { supabase } from "../supabaseClient";
import type { Wishlist, WishlistWithItems } from "@/type/wishlist";

type BuilderResult = { data: unknown; error: unknown };

interface MockBuilder {
  upsert: ReturnType<typeof jest.fn>;
  insert: ReturnType<typeof jest.fn>;
  update: ReturnType<typeof jest.fn>;
  delete: ReturnType<typeof jest.fn>;
  select: ReturnType<typeof jest.fn>;
  eq: ReturnType<typeof jest.fn>;
  in: ReturnType<typeof jest.fn>;
  order: ReturnType<typeof jest.fn>;
  limit: ReturnType<typeof jest.fn>;
  single: ReturnType<typeof jest.fn>;
  maybeSingle: ReturnType<typeof jest.fn>;
  then: (
    onFulfilled?: ((value: BuilderResult) => unknown) | null,
    onRejected?: ((reason: unknown) => unknown) | null,
  ) => Promise<unknown>;
}

function createBuilder(result: BuilderResult): MockBuilder {
  const builder: MockBuilder = {
    upsert: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    in: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    single: jest.fn(() => Promise.resolve(result)),
    maybeSingle: jest.fn(() => Promise.resolve(result)),
    then: (onFulfilled, onRejected) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  };
  return builder;
}

describe("WishlistService", () => {
  const service = new WishlistService();

  const sampleWishlist: Wishlist = {
    id: "wishlist-1",
    user_id: "user-1",
    name: "Sci-Fi Must Reads",
    created_at: "2026-10-18T10:00:00.000Z",
  };

  const bookInput = {
    id: "OL101W",
    title: "Clean Architecture",
    author: "Robert C. Martin",
  };

  function mockGetUser(user: User | null, error: AuthError | null = null) {
    return jest
      .spyOn(supabase.auth, "getUser")
      .mockResolvedValue({
        data: { user },
        error,
      } as Awaited<ReturnType<typeof supabase.auth.getUser>>);
  }

  function mockFrom(...builders: MockBuilder[]) {
    const fromSpy = jest.spyOn(supabase, "from");
    for (const builder of builders) {
      fromSpy.mockReturnValueOnce(builder as never);
    }
    return fromSpy;
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("createWishlist", () => {
    it("throws when the user is not authenticated", async () => {
      mockGetUser(null, new AuthError("User not authenticated"));

      await expect(service.createWishlist("Sci-Fi")).rejects.toThrow(
        "User not authenticated",
      );
    });

    it("throws when the name is empty", async () => {
      mockGetUser({ id: "user-1" } as User);

      await expect(service.createWishlist("   ")).rejects.toThrow(
        "Wish list name is required.",
      );
    });

    it("creates the wishlist with the trimmed name", async () => {
      mockGetUser({ id: "user-1" } as User);

      const insertBuilder = createBuilder({
        data: sampleWishlist,
        error: null,
      });
      const fromSpy = mockFrom(insertBuilder);

      const result = await service.createWishlist("  Sci-Fi Must Reads  ");

      expect(result).toEqual(sampleWishlist);
      expect(insertBuilder.insert).toHaveBeenCalledWith({
        user_id: "user-1",
        name: "Sci-Fi Must Reads",
      });
      expect(fromSpy).toHaveBeenCalledWith("wishlists");
    });
  });

  describe("addBookToWishlist", () => {
    it("throws when the wishlist does not belong to the user", async () => {
      mockGetUser({ id: "user-1" } as User);
      mockFrom(createBuilder({ data: null, error: null }));

      await expect(
        service.addBookToWishlist({
          wishlistId: "wishlist-1",
          book: bookInput,
        }),
      ).rejects.toThrow("Wish list not found.");
    });

    it("registers the book and adds the item", async () => {
      mockGetUser({ id: "user-1" } as User);

      const ownershipBuilder = createBuilder({
        data: { id: "wishlist-1" },
        error: null,
      });
      const booksBuilder = createBuilder({
        data: { id: "book-1" },
        error: null,
      });
      const insertBuilder = createBuilder({
        data: {
          id: "item-1",
          wishlist_id: "wishlist-1",
          book_id: "book-1",
          added_at: "2026-10-18T10:00:00.000Z",
        },
        error: null,
      });
      const fromSpy = mockFrom(ownershipBuilder, booksBuilder, insertBuilder);

      const result = await service.addBookToWishlist({
        wishlistId: "wishlist-1",
        book: bookInput,
      });

      expect(result.book_id).toBe("book-1");
      expect(booksBuilder.upsert).toHaveBeenCalledWith(
        { work_id: "OL101W", title: bookInput.title, author: bookInput.author },
        { onConflict: "work_id" },
      );
      expect(insertBuilder.insert).toHaveBeenCalledWith({
        wishlist_id: "wishlist-1",
        book_id: "book-1",
      });
      expect(fromSpy).toHaveBeenNthCalledWith(1, "wishlists");
      expect(fromSpy).toHaveBeenNthCalledWith(2, "books");
      expect(fromSpy).toHaveBeenNthCalledWith(3, "wishlist_items");
    });

    it("throws a friendly error when the book is already in the list", async () => {
      mockGetUser({ id: "user-1" } as User);

      const ownershipBuilder = createBuilder({
        data: { id: "wishlist-1" },
        error: null,
      });
      const booksBuilder = createBuilder({
        data: { id: "book-1" },
        error: null,
      });
      const insertBuilder = createBuilder({
        data: null,
        error: { code: "23505", message: "duplicate key value" },
      });
      mockFrom(ownershipBuilder, booksBuilder, insertBuilder);

      await expect(
        service.addBookToWishlist({
          wishlistId: "wishlist-1",
          book: bookInput,
        }),
      ).rejects.toThrow("This book is already in that wish list.");
    });
  });

  describe("removeBookFromWishlist", () => {
    it("deletes the item by id", async () => {
      mockGetUser({ id: "user-1" } as User);

      const deleteBuilder = createBuilder({ data: null, error: null });
      const fromSpy = mockFrom(deleteBuilder);

      await service.removeBookFromWishlist("item-1");

      expect(deleteBuilder.delete).toHaveBeenCalled();
      expect(deleteBuilder.eq).toHaveBeenCalledWith("id", "item-1");
      expect(fromSpy).toHaveBeenCalledWith("wishlist_items");
    });
  });

  describe("getMyWishlists", () => {
    it("returns wishlists joined with their items and books", async () => {
      const rows = [
        {
          ...sampleWishlist,
          wishlist_items: [
            {
              id: "item-1",
              wishlist_id: "wishlist-1",
              book_id: "book-1",
              added_at: "2026-10-18T10:00:00.000Z",
              books: {
                id: "book-1",
                work_id: "OL101W",
                title: "Clean Architecture",
                author: "Robert C. Martin",
                available_copies: 1,
              },
            },
          ],
        },
      ];
      const wishlistsBuilder = createBuilder({ data: rows, error: null });
      mockFrom(wishlistsBuilder);

      const result: WishlistWithItems[] = await service.getMyWishlists(
        "user-1",
      );

      expect(result).toHaveLength(1);
      expect(result[0].wishlist.name).toBe("Sci-Fi Must Reads");
      expect(result[0].items).toHaveLength(1);
      expect(result[0].items[0].book.title).toBe("Clean Architecture");
      expect(wishlistsBuilder.eq).toHaveBeenCalledWith("user_id", "user-1");
      expect(wishlistsBuilder.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
    });
  });

  describe("getBookWishlistStatus", () => {
    it("returns not in wishlist for logged-out users", async () => {
      const booksBuilder = createBuilder({
        data: { id: "book-1" },
        error: null,
      });
      const fromSpy = mockFrom(booksBuilder);

      const result = await service.getBookWishlistStatus("OL101W", null);

      expect(result).toEqual({
        bookId: "book-1",
        isInWishlist: false,
        memberships: [],
      });
      expect(fromSpy).toHaveBeenCalledTimes(1);
    });

    it("returns the wishlists containing the book", async () => {
      const booksBuilder = createBuilder({
        data: { id: "book-1" },
        error: null,
      });
      const wishlistsBuilder = createBuilder({
        data: [{ id: "wishlist-1" }, { id: "wishlist-2" }],
        error: null,
      });
      const itemsBuilder = createBuilder({
        data: [{ id: "item-9", wishlist_id: "wishlist-2" }],
        error: null,
      });
      mockFrom(booksBuilder, wishlistsBuilder, itemsBuilder);

      const result = await service.getBookWishlistStatus("OL101W", "user-1");

      expect(result).toEqual({
        bookId: "book-1",
        isInWishlist: true,
        memberships: [{ wishlistId: "wishlist-2", itemId: "item-9" }],
      });
      expect(itemsBuilder.in).toHaveBeenCalledWith("wishlist_id", [
        "wishlist-1",
        "wishlist-2",
      ]);
    });

    it("returns empty status when the user has no wishlists", async () => {
      const booksBuilder = createBuilder({
        data: { id: "book-1" },
        error: null,
      });
      const wishlistsBuilder = createBuilder({ data: [], error: null });
      mockFrom(booksBuilder, wishlistsBuilder);

      const result = await service.getBookWishlistStatus("OL101W", "user-1");

      expect(result).toEqual({
        bookId: "book-1",
        isInWishlist: false,
        memberships: [],
      });
    });
  });
});
