import { supabase } from "./supabaseClient";
import type {
  BookLoanInfo,
  BorrowBookInput,
  Loan,
  LoanWithBook,
} from "../type/loan";

export class LoanService {
  private async requireUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) {
      throw new Error("You must be logged in to manage loans.");
    }
    return data.user;
  }

  private async ensureBook({
    id,
    title,
    author,
  }: BorrowBookInput["book"]): Promise<{ id: string; availableCopies: number }> {
    const { data, error } = await supabase
      .from("books")
      .upsert({ work_id: id, title, author }, { onConflict: "work_id" })
      .select("id, available_copies")
      .single();

    if (error || !data) {
      throw new Error(
        error?.message || "Unable to register this book for borrowing.",
      );
    }

    return {
      id: data.id as string,
      availableCopies: data.available_copies as number,
    };
  }

  private parseDueDate(dueDate: string): Date {
    const due = new Date(`${dueDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(due.getTime())) {
      throw new Error("Invalid return deadline.");
    }
    if (due < today) {
      throw new Error("Return deadline must be today or later.");
    }
    return due;
  }

  async borrowBook({ book, dueDate }: BorrowBookInput): Promise<Loan> {
    const user = await this.requireUser();
    const due = this.parseDueDate(dueDate);
    const bookRow = await this.ensureBook(book);

    if (bookRow.availableCopies <= 0) {
      throw new Error("No copies of this book are available to borrow.");
    }

    const { data: activeLoan } = await supabase
      .from("loans")
      .select("id")
      .eq("book_id", bookRow.id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (activeLoan) {
      throw new Error("You already have an active loan for this book.");
    }

    const { data, error } = await supabase
      .from("loans")
      .insert({
        user_id: user.id,
        book_id: bookRow.id,
        due_date: due.toISOString(),
        status: "active",
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Unable to borrow this book.");
    }

    return data as Loan;
  }

  async returnBook(loanId: string): Promise<Loan> {
    await this.requireUser();

    const { data, error } = await supabase
      .from("loans")
      .update({
        status: "returned",
        returned_at: new Date().toISOString(),
      })
      .eq("id", loanId)
      .eq("status", "active")
      .select()
      .single();

    if (error || !data) {
      if (error?.code === "PGRST116") {
        throw new Error("This loan was not found or was already returned.");
      }
      throw new Error(error?.message || "Unable to return this book.");
    }

    return data as Loan;
  }

  async getBookLoanInfo(
    workId: string,
    userId: string | null,
  ): Promise<BookLoanInfo> {
    const { data, error } = await supabase
      .from("books")
      .select("id, available_copies")
      .eq("work_id", workId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return { bookId: null, availableCopies: null, activeLoan: null };
    }

    const bookInfo: BookLoanInfo = {
      bookId: data.id as string,
      availableCopies: data.available_copies as number,
      activeLoan: null,
    };

    if (!userId) {
      return bookInfo;
    }

    const { data: loan, error: loanError } = await supabase
      .from("loans")
      .select("*")
      .eq("book_id", data.id)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (loanError) {
      throw new Error(loanError.message);
    }

    bookInfo.activeLoan = (loan as Loan | null) ?? null;
    return bookInfo;
  }

  async getMyLoans(userId: string): Promise<LoanWithBook[]> {
    const { data, error } = await supabase
      .from("loans")
      .select("*, books(id, work_id, title, author, available_copies)")
      .eq("user_id", userId)
      .order("borrowed_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).flatMap((row) => {
      const book = row.books as LoanWithBook["book"] | null;
      if (!book) return [];

      const loan: Loan = {
        id: row.id,
        user_id: row.user_id,
        book_id: row.book_id,
        borrowed_at: row.borrowed_at,
        due_date: row.due_date,
        returned_at: row.returned_at,
        status: row.status,
        reading_progress: row.reading_progress,
        created_at: row.created_at,
      };

      return [{ loan, book }];
    });
  }
}

export const loanService = new LoanService();
