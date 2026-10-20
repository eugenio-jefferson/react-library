import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import CatalogCarousel from "../CatalogCarousel";
import type { CatalogCarouselProps } from "../CatalogCarousel";
import type { Book } from "@/type/book";

const books: Book[] = [
  {
    id: "work-1",
    title: "The Pragmatic Programmer",
    author: "Hunt & Thomas",
    genre: "Programming",
    status: "free_to_read",
    cover_image: "https://covers.openlibrary.org/b/id/1-M.jpg",
  },
  {
    id: "work-2",
    title: "Clean Code",
    author: "Robert C. Martin",
    genre: "Programming",
    status: "free_to_read",
    cover_image: "https://covers.openlibrary.org/b/id/2-M.jpg",
  },
];

const renderCarousel = (props: CatalogCarouselProps = {}) =>
  render(
    <MemoryRouter>
      <CatalogCarousel {...props} />
    </MemoryRouter>,
  );

describe("CatalogCarousel", () => {
  it("renders a carousel region with one item per book", () => {
    renderCarousel({ books, label: "Trending books" });

    const region = screen.getByRole("region", { name: "Trending books" });
    expect(region).toHaveAttribute("aria-roledescription", "carousel");

    const slides = screen.getAllByRole("group");
    expect(slides).toHaveLength(2);
    expect(slides[0]).toHaveAttribute("aria-roledescription", "slide");
  });

  it("renders skeleton cards while loading", () => {
    renderCarousel({ isLoading: true, skeletonCount: 4 });

    const region = screen.getByRole("region");
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
    expect(screen.getAllByRole("group")).toHaveLength(4);
  });

  it("renders navigation buttons", () => {
    renderCarousel({ books });

    expect(
      screen.getByRole("button", { name: /previous slide/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /next slide/i }),
    ).toBeInTheDocument();
  });

  it("renders nothing for an empty list", () => {
    const { container } = renderCarousel({ books: [] });

    expect(container).toBeEmptyDOMElement();
  });
});
