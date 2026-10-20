import { jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SearchPage from "../SearchPage";
import { openLibraryService } from "@/services/openLibraryService";

function LocationProbe() {
  const [searchParams] = useSearchParams();
  return <div data-testid="probe">{searchParams.get("q")}</div>;
}

function renderSearchPage(initialEntry = "/search?q=old+term") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationProbe />
        <Routes>
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SearchPage", () => {
  beforeEach(() => {
    jest.spyOn(openLibraryService, "searchBooks").mockResolvedValue({
      books: [],
      total: 0,
      limit: 20,
      offset: 0,
      page: 1,
      totalPages: 1,
      hasMore: false,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("seeds the search bar from the URL query", () => {
    renderSearchPage();

    expect(
      screen.getByPlaceholderText("Search books in Open Library..."),
    ).toHaveValue("old term");
  });

  it("keeps the typed search term even when the URL already has a query", async () => {
    renderSearchPage();

    const input = screen.getByPlaceholderText("Search books in Open Library...");
    fireEvent.change(input, { target: { value: "another book" } });

    expect(input).toHaveValue("another book");
    await waitFor(() => {
      expect(input).toHaveValue("another book");
    });
  });

  it("updates the URL query when the search is submitted", async () => {
    renderSearchPage();

    const input = screen.getByPlaceholderText("Search books in Open Library...");
    fireEvent.change(input, { target: { value: "submitted term" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByTestId("probe")).toHaveTextContent("submitted term");
    });
    expect(input).toHaveValue("submitted term");
  });
});
