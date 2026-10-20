import { memo, useState } from "react";
import { Link } from "react-router";
import { cn } from "cn";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isSafeImageSource } from "@/utils/sanitize";

interface BookCardProps {
  readonly id?: string;
  readonly title: string;
  readonly author: string;
  readonly cover_image: string;
  readonly fill?: boolean;
}

export const BookCard = memo(function BookCard({
  id,
  title,
  author,
  cover_image,
  fill = false,
}: BookCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const safeCoverSource = isSafeImageSource(cover_image)
    ? cover_image
    : undefined;

  const card = (
    <Card
      className={cn(
        "relative w-full pt-0 overflow-hidden shadow-xs max-w-3xs",
        !fill && "mx-auto max-w-3xs",
      )}
    >
      <div className="relative aspect-2/3 w-full bg-muted/60 overflow-hidden">
        {!imageLoaded && (
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
        )}
        <img
          src={safeCoverSource}
          alt={title}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
      <CardHeader className="p-3">
        <CardTitle className="line-clamp-1 font-semibold">{title}</CardTitle>
        <CardDescription className="line-clamp-1 text-sm text-color-[--color-foreground]">
          {author}
        </CardDescription>
      </CardHeader>
    </Card>
  );

  if (!id) return card;

  return (
    <Link
      to={`/books/${id}`}
      className="transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-ring/50"
    >
      {card}
    </Link>
  );
});

export function BookCardSkeleton() {
  return (
    <Card className="relative mx-auto w-full max-w-3xs pt-0 overflow-hidden shadow-xs">
      <div className="relative aspect-2/3 w-full">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
      <CardHeader className="space-y-2 p-3">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </CardHeader>
    </Card>
  );
}
