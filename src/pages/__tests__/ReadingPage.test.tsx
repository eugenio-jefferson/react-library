import { jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import ReadingPage from "../ReadingPage";
import { supabase } from "@/services/supabaseClient";
import { loanService } from "@/services/loanService";
import { openLibraryService } from "@/services/openLibraryService";
import type { BookDetails } from "@/type/book";
import type { Loan } from "@/type/loan";
import type { ReadingPages, ReadingSource } from "@/type/reading";

const bookDetails: BookDetails = {
  id: "OL1W",
  key: "/works/OL1W",
  title: "Pride and Prejudice",
  author: "Jane Austen",
  category: "Fiction",
  description: "A classic novel.",
  cover_image: "https://covers.openlibrary.org/b/id/1-L.jpg",
  subjects: ["Fiction"],
  publish_date: "1813",
};

const activeLoan: Loan = {
  id: "loan-1",
  user_id: "user-1",
  book_id: "book-1",
  borrowed_at: "2026-10-01T00:00:00.000Z",
  due_date: "2026-12-01T00:00:00.000Z",
  returned_at: null,
  status: "active",
  reading_progress: "reading",
  created_at: "2026-10-01T00:00:00.000Z",
};

const readingSource: ReadingSource = {
  workId: "OL1W",
  iaIdentifier: "prideprejudice00austuoft",
  editionKey: "/books/OL1M",
  editionTitle: "Pride and Prejudice",
};

const readingPages: ReadingPages = {
  iaIdentifier: "prideprejudice00austuoft",
  total: 3,
  pages: [
    {
      index: 0,
      label: "1",
      imageUrl: "https://iiif.archive.org/image/iiif/3/book/page1/full/1000,/0/default.jpg",
    },
    {
      index: 1,
      label: "2",
      imageUrl: "https://iiif.archive.org/image/iiif/3/book/page2/full/1000,/0/default.jpg",
    },
    {
      index: 2,
      label: "iii",
      imageUrl: "https://iiif.archive.org/image/iiif/3/book/page3/full/1000,/0/default.jpg",
    },
  ],
};

function mockAuth(session: Session | null) {
  jest
    .spyOn(supabase.auth, "getSession")
    .mockResolvedValue({
      data: { session },
      error: null,
    } as Awaited<ReturnType<typeof supabase.auth.getSession>>);

  jest.spyOn(supabase.auth, "onAuthStateChange").mockReturnValue({
    data: {
      subscription: { unsubscribe: jest.fn() },
    },
    error: null,
  } as unknown as ReturnType<typeof supabase.auth.onAuthStateChange>);
}

function mockBorrowedBook(options: { pages?: ReadingPages | Error } = {}) {
  mockAuth({ user: { id: "user-1" } } as unknown as Session);
  jest
    .spyOn(openLibraryService, "getBookDetails")
    .mockResolvedValue(bookDetails);
  jest.spyOn(loanService, "getBookLoanInfo").mockResolvedValue({
    bookId: "book-1",
    availableCopies: 1,
    activeLoan,
  });
  jest
    .spyOn(openLibraryService, "getReadingSource")
    .mockResolvedValue(readingSource);

  const pagesMock = jest.spyOn(openLibraryService, "getReadingPages");
  if (options.pages instanceof Error) {
    pagesMock.mockRejectedValue(options.pages);
  } else {
    pagesMock.mockResolvedValue(options.pages ?? readingPages);
  }
}

function renderReadingPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/books/OL1W/read"]}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/books/:id" element={<div>Book page</div>} />
          <Route path="/books/:id/read" element={<ReadingPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ReadingPage", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("redirects logged-out users to the login page", async () => {
    mockAuth(null);

    renderReadingPage();

    await waitFor(() => {
      expect(screen.getByText("Login page")).toBeInTheDocument();
    });
  });

  it("redirects to the book page when the user has no active loan", async () => {
    mockAuth({ user: { id: "user-1" } } as unknown as Session);
    jest
      .spyOn(openLibraryService, "getBookDetails")
      .mockResolvedValue(bookDetails);
    jest.spyOn(loanService, "getBookLoanInfo").mockResolvedValue({
      bookId: null,
      availableCopies: null,
      activeLoan: null,
    });
    jest
      .spyOn(openLibraryService, "getReadingSource")
      .mockResolvedValue(readingSource);

    renderReadingPage();

    await waitFor(() => {
      expect(screen.getByText("Book page")).toBeInTheDocument();
    });
    expect(
      screen.queryByAltText(/^Page \d+ of \d+$/),
    ).not.toBeInTheDocument();
  });

  it("renders the first page and navigates between pages", async () => {
    mockBorrowedBook();

    renderReadingPage();

    const firstPage = await screen.findByAltText("Page 1 of 3");
    expect(firstPage).toHaveAttribute("src", readingPages.pages[0].imageUrl);
    expect(screen.getByText("of 3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /return book/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next page/i }));
    expect(await screen.findByAltText("Page 2 of 3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /last page/i }));
    const lastPage = await screen.findByAltText("Page 3 of 3");
    expect(lastPage).toHaveAttribute("src", readingPages.pages[2].imageUrl);
    expect(screen.getByText("printed page iii")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /first page/i }));
    expect(await screen.findByAltText("Page 1 of 3")).toBeInTheDocument();
  });

  it("jumps to a page typed in the page number input", async () => {
    mockBorrowedBook();

    renderReadingPage();

    await screen.findByAltText("Page 1 of 3");
    const input = screen.getByRole("spinbutton", { name: /page number/i });
    fireEvent.change(input, { target: { value: "3" } });
    expect(await screen.findByAltText("Page 3 of 3")).toBeInTheDocument();
  });

  it("falls back to an archive.org preview when the pages cannot be loaded", async () => {
    mockBorrowedBook({ pages: new Error("No readable pages were found for this book.") });

    renderReadingPage();

    const loadButton = await screen.findByRole("button", {
      name: /load interactive preview/i,
    });
    expect(loadButton).toBeInTheDocument();
    expect(
      screen.queryByTitle("Preview of Pride and Prejudice"),
    ).not.toBeInTheDocument();

    fireEvent.click(loadButton);

    const preview = await screen.findByTitle("Preview of Pride and Prejudice");
    expect(preview).toHaveAttribute(
      "src",
      "https://archive.org/embed/prideprejudice00austuoft",
    );
    const archiveLink = screen.getByRole("link", { name: /open on archive.org/i });
    expect(archiveLink).toHaveAttribute(
      "href",
      "https://archive.org/details/prideprejudice00austuoft",
    );
    expect(
      screen.queryByAltText(/^Page \d+ of \d+$/),
    ).not.toBeInTheDocument();
  });

  it("shows an archive.org preview when Open Library has no readable edition", async () => {
    mockAuth({ user: { id: "user-1" } } as unknown as Session);
    jest
      .spyOn(openLibraryService, "getBookDetails")
      .mockResolvedValue(bookDetails);
    jest.spyOn(loanService, "getBookLoanInfo").mockResolvedValue({
      bookId: "book-1",
      availableCopies: 1,
      activeLoan,
    });
    jest.spyOn(openLibraryService, "getReadingSource").mockResolvedValue(null);
    jest
      .spyOn(openLibraryService, "searchArchiveIdentifier")
      .mockResolvedValue("pride-and-prejudice_202606");

    renderReadingPage();

    const loadButton = await screen.findByRole("button", {
      name: /load interactive preview/i,
    });
    expect(loadButton).toBeInTheDocument();

    fireEvent.click(loadButton);

    const preview = await screen.findByTitle("Preview of Pride and Prejudice");
    expect(preview).toHaveAttribute(
      "src",
      "https://archive.org/embed/pride-and-prejudice_202606",
    );
    expect(screen.getByText(/showing a/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open on archive.org/i }),
    ).toHaveAttribute(
      "href",
      "https://archive.org/details/pride-and-prejudice_202606",
    );
    expect(
      screen.getByRole("button", { name: /return book/i }),
    ).toBeInTheDocument();
  });

  it("offers an archive.org search when neither edition nor preview is found", async () => {
    mockAuth({ user: { id: "user-1" } } as unknown as Session);
    jest
      .spyOn(openLibraryService, "getBookDetails")
      .mockResolvedValue(bookDetails);
    jest.spyOn(loanService, "getBookLoanInfo").mockResolvedValue({
      bookId: "book-1",
      availableCopies: 1,
      activeLoan,
    });
    jest.spyOn(openLibraryService, "getReadingSource").mockResolvedValue(null);
    jest
      .spyOn(openLibraryService, "searchArchiveIdentifier")
      .mockResolvedValue(null);

    renderReadingPage();

    await waitFor(() => {
      expect(
        screen.getByText(/no readable digital copy available/i),
      ).toBeInTheDocument();
    });
    const searchLink = screen.getByRole("link", {
      name: /search on archive.org/i,
    });
    expect(searchLink.getAttribute("href")).toContain("archive.org/search");
    expect(
      screen.queryByTitle("Preview of Pride and Prejudice"),
    ).not.toBeInTheDocument();
  });

  it("shows a retry state when the archive.org preview search fails", async () => {
    mockAuth({ user: { id: "user-1" } } as unknown as Session);
    jest
      .spyOn(openLibraryService, "getBookDetails")
      .mockResolvedValue(bookDetails);
    jest.spyOn(loanService, "getBookLoanInfo").mockResolvedValue({
      bookId: "book-1",
      availableCopies: 1,
      activeLoan,
    });
    jest.spyOn(openLibraryService, "getReadingSource").mockResolvedValue(null);
    jest
      .spyOn(openLibraryService, "searchArchiveIdentifier")
      .mockRejectedValue(new Error("Error searching archive.org (500)"));

    renderReadingPage();

    await waitFor(() => {
      expect(
        screen.getByText("Error searching archive.org (500)"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });
});
