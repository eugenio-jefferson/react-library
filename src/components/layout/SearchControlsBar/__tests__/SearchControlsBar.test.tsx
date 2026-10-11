import { jest } from "@jest/globals";
import { render, fireEvent, screen, within } from "@testing-library/react";
import SearchControlsBar from "../SearchControlsBar";
import type { SearchControlsBarProps } from "../SearchControlsBar";
import type { BookSortOption } from "@/type/book";

describe("SearchControlsBar", () => {
  const createProps = (
    overrides: Partial<SearchControlsBarProps> = {},
  ): SearchControlsBarProps => ({
    sort: "relevance",
    onSortChange: jest.fn(),
    genre: "",
    onGenreChange: jest.fn(),
    availableGenres: ["Fiction", "Fantasy"],
    onResetFilters: jest.fn(),
    resultsCountText: "40 books found",
    isFetching: false,
    ...overrides,
  });

  const renderBar = (overrides: Partial<SearchControlsBarProps> = {}) => {
    const props = createProps(overrides);
    const utils = render(<SearchControlsBar {...props} />);
    return { ...utils, props };
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("should render the results count text", () => {
    renderBar({ resultsCountText: "40 books found" });

    expect(screen.getByRole("status")).toHaveTextContent("40 books found");
  });

  it("should render the 'No books found' message when there are no results", () => {
    renderBar({ resultsCountText: "No books found" });

    expect(screen.getByRole("status")).toHaveTextContent("No books found");
  });

  it("should render a sort select with all sort options", () => {
    renderBar();

    const sortSelect = screen.getByRole("combobox", { name: "Sort by" });
    expect(sortSelect).toHaveValue("relevance");

    const options = within(sortSelect).getAllByRole("option");
    expect(
      options.map((option) => (option as HTMLOptionElement).value),
    ).toEqual([
      "relevance",
      "popularity",
      "rating",
      "author",
      "title",
      "newest",
    ]);
    expect(screen.getByRole("option", { name: "Most Popular" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Newest Editions" })).toBeInTheDocument();
  });

  it("should call onSortChange with the selected sort value", () => {
    const { props } = renderBar();

    fireEvent.change(screen.getByRole("combobox", { name: "Sort by" }), {
      target: { value: "title" },
    });

    expect(props.onSortChange).toHaveBeenCalledTimes(1);
    expect(props.onSortChange).toHaveBeenCalledWith("title" as BookSortOption);
  });

  it("should render the genre select with an 'All Genres' option", () => {
    renderBar({ availableGenres: ["Fiction", "Fantasy"] });

    const genreSelect = screen.getByRole("combobox", { name: "Genre" });
    expect(genreSelect).toHaveValue("");
    expect(screen.getByRole("option", { name: "All Genres" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Fiction" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Fantasy" })).toBeInTheDocument();
  });

  it("should hide the genre select when there are no available genres", () => {
    renderBar({ availableGenres: [] });

    expect(screen.queryByRole("combobox", { name: "Genre" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Sort by" })).toBeInTheDocument();
  });

  it("should call onGenreChange with the selected genre", () => {
    const { props } = renderBar({ availableGenres: ["Fiction", "Fantasy"] });

    fireEvent.change(screen.getByRole("combobox", { name: "Genre" }), {
      target: { value: "Fiction" },
    });

    expect(props.onGenreChange).toHaveBeenCalledTimes(1);
    expect(props.onGenreChange).toHaveBeenCalledWith("Fiction");
  });

  it("should keep the controlled sort and genre values", () => {
    renderBar({ sort: "title", genre: "Fantasy", availableGenres: ["Fantasy"] });

    expect(screen.getByRole("combobox", { name: "Sort by" })).toHaveValue("title");
    expect(screen.getByRole("combobox", { name: "Genre" })).toHaveValue("Fantasy");
  });

  it("should hide the clear filters button when filters are at their defaults", () => {
    renderBar({ sort: "relevance", genre: "" });

    expect(
      screen.queryByRole("button", { name: /clear filters/i }),
    ).not.toBeInTheDocument();
  });

  it("should show the clear filters button when a non default sort is active", () => {
    renderBar({ sort: "rating", genre: "" });

    expect(screen.getByRole("button", { name: /clear filters/i })).toBeInTheDocument();
  });

  it("should show the clear filters button when a genre is selected", () => {
    renderBar({ sort: "relevance", genre: "Fiction" });

    expect(screen.getByRole("button", { name: /clear filters/i })).toBeInTheDocument();
  });

  it("should call onResetFilters when the clear filters button is clicked", () => {
    const { props } = renderBar({ sort: "popularity", genre: "Fiction" });

    fireEvent.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(props.onResetFilters).toHaveBeenCalledTimes(1);
  });

  it("should not show the fetching indicator when there is no fetch in progress", () => {
    const { container } = renderBar({ isFetching: false });

    expect(container.querySelector(".animate-spin")).not.toBeInTheDocument();
  });

  it("should show the fetching indicator while a fetch is in progress", () => {
    const { container } = renderBar({
      isFetching: true,
      resultsCountText: "Searching...",
    });

    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Searching...");
  });
});
