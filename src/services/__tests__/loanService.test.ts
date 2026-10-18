import { jest } from "@jest/globals";
import { AuthError, type User } from "@supabase/supabase-js";
import { LoanService } from "../loanService";
import { supabase } from "../supabaseClient";
import type { Loan, LoanWithBook } from "@/type/loan";

type BuilderResult = { data: unknown; error: unknown };

interface MockBuilder {
  upsert: ReturnType<typeof jest.fn>;
  insert: ReturnType<typeof jest.fn>;
  update: ReturnType<typeof jest.fn>;
  select: ReturnType<typeof jest.fn>;
  eq: ReturnType<typeof jest.fn>;
  order: ReturnType<typeof jest.fn>;
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
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    single: jest.fn(() => Promise.resolve(result)),
    maybeSingle: jest.fn(() => Promise.resolve(result)),
    then: (onFulfilled, onRejected) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  };
  return builder;
}

describe("LoanService", () => {
  const service = new LoanService();

  const sampleLoan: Loan = {
    id: "loan-1",
    user_id: "user-1",
    book_id: "book-1",
    borrowed_at: "2026-10-18T10:00:00.000Z",
    due_date: "2999-01-01T00:00:00.000Z",
    returned_at: null,
    status: "active",
    reading_progress: "reading",
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

  describe("borrowBook", () => {
    it("throws when the user is not authenticated", async () => {
      mockGetUser(null, new AuthError("User not authenticated"));

      await expect(
        service.borrowBook({ book: bookInput, dueDate: "2999-01-01" }),
      ).rejects.toThrow("User not authenticated");
    });

    it("throws when the due date is in the past", async () => {
      mockGetUser({ id: "user-1" } as User);

      await expect(
        service.borrowBook({ book: bookInput, dueDate: "2020-01-01" }),
      ).rejects.toThrow("Return deadline must be today or later.");
    });

    it("throws when no copies are available", async () => {
      mockGetUser({ id: "user-1" } as User);
      mockFrom(
        createBuilder({ data: { id: "book-1", available_copies: 0 }, error: null }),
      );

      await expect(
        service.borrowBook({ book: bookInput, dueDate: "2999-01-01" }),
      ).rejects.toThrow("No copies of this book are available to borrow.");
    });

    it("registers the book and creates the loan", async () => {
      mockGetUser({ id: "user-1" } as User);

      const booksBuilder = createBuilder({
        data: { id: "book-1", available_copies: 2 },
        error: null,
      });
      const activeCheckBuilder = createBuilder({ data: null, error: null });
      const insertBuilder = createBuilder({ data: sampleLoan, error: null });
      const fromSpy = mockFrom(
        booksBuilder,
        activeCheckBuilder,
        insertBuilder,
      );

      const result = await service.borrowBook({
        book: bookInput,
        dueDate: "2999-01-01",
      });

      expect(result).toEqual(sampleLoan);
      expect(booksBuilder.upsert).toHaveBeenCalledWith(
        { work_id: "OL101W", title: bookInput.title, author: bookInput.author },
        { onConflict: "work_id" },
      );
      expect(insertBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          book_id: "book-1",
          status: "active",
        }),
      );
      expect(fromSpy).toHaveBeenCalledTimes(3);
      expect(fromSpy).toHaveBeenNthCalledWith(1, "books");
      expect(fromSpy).toHaveBeenNthCalledWith(2, "loans");
      expect(fromSpy).toHaveBeenNthCalledWith(3, "loans");
    });

    it("throws when the user already has an active loan for the book", async () => {
      mockGetUser({ id: "user-1" } as User);

      const booksBuilder = createBuilder({
        data: { id: "book-1", available_copies: 2 },
        error: null,
      });
      const activeCheckBuilder = createBuilder({
        data: { id: "loan-0" },
        error: null,
      });
      mockFrom(booksBuilder, activeCheckBuilder);

      await expect(
        service.borrowBook({ book: bookInput, dueDate: "2999-01-01" }),
      ).rejects.toThrow("You already have an active loan for this book.");
    });
  });

  describe("returnBook", () => {
    it("marks the loan as returned", async () => {
      mockGetUser({ id: "user-1" } as User);

      const returnedLoan: Loan = {
        ...sampleLoan,
        status: "returned",
        returned_at: "2026-10-20T10:00:00.000Z",
      };
      const updateBuilder = createBuilder({
        data: returnedLoan,
        error: null,
      });
      mockFrom(updateBuilder);

      const result = await service.returnBook("loan-1");

      expect(result).toEqual(returnedLoan);
      expect(updateBuilder.update).toHaveBeenCalledWith({
        status: "returned",
        returned_at: expect.any(String),
      });
      expect(updateBuilder.eq).toHaveBeenCalledWith("id", "loan-1");
      expect(updateBuilder.eq).toHaveBeenCalledWith("status", "active");
    });

    it("throws when the loan was not found or was already returned", async () => {
      mockGetUser({ id: "user-1" } as User);
      mockFrom(
        createBuilder({
          data: null,
          error: { code: "PGRST116", message: "no rows returned" },
        }),
      );

      await expect(service.returnBook("loan-1")).rejects.toThrow(
        "This loan was not found or was already returned.",
      );
    });
  });

  describe("getBookLoanInfo", () => {
    it("returns availability without querying loans for logged-out users", async () => {
      const booksBuilder = createBuilder({
        data: { id: "book-1", available_copies: 2 },
        error: null,
      });
      const fromSpy = mockFrom(booksBuilder);

      const result = await service.getBookLoanInfo("OL101W", null);

      expect(result).toEqual({
        bookId: "book-1",
        availableCopies: 2,
        activeLoan: null,
      });
      expect(fromSpy).toHaveBeenCalledTimes(1);
      expect(fromSpy).toHaveBeenCalledWith("books");
    });

    it("returns the active loan of the current user", async () => {
      const booksBuilder = createBuilder({
        data: { id: "book-1", available_copies: 0 },
        error: null,
      });
      const loansBuilder = createBuilder({ data: sampleLoan, error: null });
      const fromSpy = mockFrom(booksBuilder, loansBuilder);

      const result = await service.getBookLoanInfo("OL101W", "user-1");

      expect(result).toEqual({
        bookId: "book-1",
        availableCopies: 0,
        activeLoan: sampleLoan,
      });
      expect(fromSpy).toHaveBeenNthCalledWith(2, "loans");
      expect(loansBuilder.eq).toHaveBeenCalledWith("book_id", "book-1");
      expect(loansBuilder.eq).toHaveBeenCalledWith("user_id", "user-1");
      expect(loansBuilder.eq).toHaveBeenCalledWith("status", "active");
    });

    it("returns empty info when the book is not registered yet", async () => {
      mockFrom(createBuilder({ data: null, error: null }));

      const result = await service.getBookLoanInfo("OL101W", "user-1");

      expect(result).toEqual({
        bookId: null,
        availableCopies: null,
        activeLoan: null,
      });
    });

    it("throws when the books query fails", async () => {
      mockFrom(
        createBuilder({
          data: null,
          error: { message: "permission denied for table books" },
        }),
      );

      await expect(service.getBookLoanInfo("OL101W", null)).rejects.toThrow(
        "permission denied for table books",
      );
    });

    it("throws when the loans query fails", async () => {
      mockFrom(
        createBuilder({
          data: { id: "book-1", available_copies: 1 },
          error: null,
        }),
        createBuilder({
          data: null,
          error: { message: "permission denied for table loans" },
        }),
      );

      await expect(service.getBookLoanInfo("OL101W", "user-1")).rejects.toThrow(
        "permission denied for table loans",
      );
    });
  });

  describe("getMyLoans", () => {
    it("returns the user loans joined with book data", async () => {
      const rows = [
        {
          ...sampleLoan,
          books: {
            id: "book-1",
            work_id: "OL101W",
            title: "Clean Architecture",
            author: "Robert C. Martin",
            available_copies: 0,
          },
        },
      ];
      const loansBuilder = createBuilder({ data: rows, error: null });
      mockFrom(loansBuilder);

      const result: LoanWithBook[] = await service.getMyLoans("user-1");

      expect(result).toHaveLength(1);
      expect(result[0].book.title).toBe("Clean Architecture");
      expect(result[0].loan.id).toBe("loan-1");
      expect(loansBuilder.eq).toHaveBeenCalledWith("user_id", "user-1");
      expect(loansBuilder.order).toHaveBeenCalledWith("borrowed_at", {
        ascending: false,
      });
    });
  });
});
