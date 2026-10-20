import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BookSortOption } from "@/type/book";
import { FilterX, Loader2, SlidersHorizontal } from "lucide-react";

const SORT_OPTIONS: Array<{ value: BookSortOption; label: string }> = [
  { value: "relevance", label: "Relevance" },
  { value: "popularity", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
  { value: "author", label: "Author (A-Z)" },
  { value: "title", label: "Title (A-Z)" },
  { value: "newest", label: "Newest Editions" },
];

export interface SearchControlsBarProps {
  readonly sort: BookSortOption;
  readonly onSortChange: (sort: BookSortOption) => void;
  readonly genre: string;
  readonly onGenreChange: (genre: string) => void;
  readonly availableGenres?: readonly string[];
  readonly onResetFilters: () => void;
  readonly resultsCountText: string;
  readonly isFetching?: boolean;
}

function SearchControlsBar({
  sort,
  onSortChange,
  genre,
  onGenreChange,
  availableGenres = [],
  onResetFilters,
  resultsCountText,
  isFetching = false,
}: SearchControlsBarProps) {
  const hasActiveFilters = Boolean(genre) || sort !== "relevance";

  return (
    <Card className="flex w-full max-w-7xl items-center justify-between gap-3 rounded-xl p-4 shadow-xs">
      <div className="flex w-full flex-col justify-center gap-3 sm:flex-row md:flex-row md:w-auto md:items-center">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="h-6 w-6 text-primary" />
          <span>Sort by:</span>
        </div>
        <select
          value={sort}
          aria-label="Sort by"
          onChange={(e) => onSortChange(e.target.value as BookSortOption)}
          className="min-w-0 flex-1 rounded-md border bg-background px-3 py-1.5 text-sm font-medium shadow-xs focus:outline-hidden focus:ring-2 focus:ring-primary md:flex-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {availableGenres.length > 0 && (
          <select
            value={genre}
            aria-label="Genre"
            onChange={(e) => onGenreChange(e.target.value)}
            className="min-w-0 flex-1 rounded-md border bg-background px-3 py-1.5 text-sm font-medium shadow-xs focus:outline-hidden focus:ring-2 focus:ring-primary md:flex-none"
          >
            <option value="">All Genres</option>
            {availableGenres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <FilterX className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      <output className="flex items-center gap-2 text-sm text-secondary-foreground">
        {isFetching && (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        )}
        <span>{resultsCountText}</span>
      </output>
    </Card>
  );
}

export default SearchControlsBar;
