import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import BookCard, { BookCardSkeleton } from "@/components/layout/BookCard";
import type { Book } from "@/type/book";

export interface CatalogCarouselProps {
  readonly books?: Book[];
  readonly isLoading?: boolean;
  readonly skeletonCount?: number;
  readonly label?: string;
}

const ITEM_CLASSES =
  "pl-3 md:pl-4 basis-[55%] sm:basis-[40%] md:basis-1/3 lg:basis-1/4 xl:basis-1/6";

function CatalogCarousel({
  books = [],
  isLoading = false,
  skeletonCount = 6,
  label,
}: CatalogCarouselProps) {
  const entries: Array<{ key: string; book?: Book }> = isLoading
    ? Array.from({ length: skeletonCount }, (_, index) => ({
        key: `skeleton-${index}`,
      }))
    : books.map((book) => ({ key: book.id, book }));

  if (!isLoading && entries.length === 0) return null;

  return (
    <Carousel
      opts={{ align: "start", slidesToScroll: "auto" }}
      className="w-full"
      aria-label={label}
    >
      <CarouselContent className="-ml-3 md:-ml-4">
        {entries.map(({ key, book }) => (
          <CarouselItem key={key} className={ITEM_CLASSES}>
            {book ? (
              <BookCard
                fill
                id={book.id}
                title={book.title}
                author={book.author}
                cover_image={book.cover_image}
              />
            ) : (
              <BookCardSkeleton />
            )}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

export default CatalogCarousel;
