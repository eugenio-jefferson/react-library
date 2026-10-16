import BookCard, { BookCardSkeleton } from "@/components/layout/BookCard";
import type { Book } from "@/type/book";

interface CatalogProps {
  readonly books?: Book[];
  readonly isLoading?: boolean;
  readonly skeletonCount?: number;
}

function Catalog({
  books = [],
  isLoading = false,
  skeletonCount = 10,
}: CatalogProps) {
  if (isLoading) {
    return (
      <section className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <BookCardSkeleton key={`skeleton-${index}`} />
        ))}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {books.map((book) => (
        <BookCard
          key={book.id}
          id={book.id}
          title={book.title}
          author={book.author}
          cover_image={book.cover_image}
        />
      ))}
    </section>
  );
}

export default Catalog;
