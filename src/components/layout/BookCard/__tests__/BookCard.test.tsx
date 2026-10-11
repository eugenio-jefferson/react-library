import { jest } from "@jest/globals";
import { render, fireEvent, screen } from "@testing-library/react";
import { BookCard, BookCardSkeleton } from "../BookCard";

describe("BookCard", () => {
  const props = {
    title: "Clean Architecture",
    author: "Robert C. Martin",
    cover_image: "https://covers.openlibrary.org/b/id/111-M.jpg",
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("should render the title and the author", () => {
    render(<BookCard {...props} />);

    expect(screen.getByText("Clean Architecture")).toBeInTheDocument();
    expect(screen.getByText("Robert C. Martin")).toBeInTheDocument();
  });

  it("should render the cover image with the title as alt text", () => {
    render(<BookCard {...props} />);

    const image = screen.getByRole("img", { name: "Clean Architecture" });
    expect(image).toHaveAttribute("src", props.cover_image);
    expect(image).toHaveAttribute("loading", "lazy");
  });

  it("should show a skeleton while the cover image has not loaded", () => {
    const { container } = render(<BookCard {...props} />);

    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveClass("opacity-0");
  });

  it("should hide the skeleton and reveal the image after it loads", () => {
    const { container } = render(<BookCard {...props} />);

    fireEvent.load(screen.getByRole("img"));

    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveClass("opacity-100");
    expect(screen.getByRole("img")).not.toHaveClass("opacity-0");
  });
});

describe("BookCardSkeleton", () => {
  it("should render placeholder skeletons without text or images", () => {
    const { container } = render(<BookCardSkeleton />);

    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.queryByText(/.+/)).not.toBeInTheDocument();
  });
});
