import { useState } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface BookCardProps {
  readonly title: string;
  readonly author: string;
  readonly cover_image: string;
}

export function BookCard({ title, author, cover_image }: BookCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Card className="relative mx-auto w-full max-w-3xs pt-0 overflow-hidden shadow-xs">
      <div className="relative aspect-2/3 w-full bg-muted/60 overflow-hidden">
        {!imageLoaded && (
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
        )}
        <img
          src={cover_image}
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
}

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
