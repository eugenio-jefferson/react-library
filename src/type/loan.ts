import type { BookDetails } from "./book";

export type LoanStatus = "active" | "returned" | "overdue";

export type ReadingStatus = "reading" | "completed" | "dropped";

export interface Loan {
  id: string;
  user_id: string;
  book_id: string;
  borrowed_at: string;
  due_date: string;
  returned_at: string | null;
  status: LoanStatus;
  reading_progress: ReadingStatus;
  created_at: string;
}

export interface LoanBook {
  id: string;
  work_id: string;
  title: string;
  author: string;
  available_copies: number;
}

export interface LoanWithBook {
  loan: Loan;
  book: LoanBook;
}

export interface BookLoanInfo {
  bookId: string | null;
  availableCopies: number | null;
  activeLoan: Loan | null;
}

export interface BorrowBookInput {
  book: Pick<BookDetails, "id" | "title" | "author">;
  dueDate: string;
}
