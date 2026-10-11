import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import SearchBar from "../components/layout/SearchBar";
import Catalog from "@/components/layout/Catalog";
import SearchControlsBar from "@/components/layout/SearchControlsBar";
import { useBookSearch } from "@/hooks/useBookSearch";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  const {
    books,
    total,
    page,
    totalPages,
    hasMore,
    isLoading,
    isFetching,
    isError,
    error,
    query,
    setQuery,
    setPage,
    nextPage,
    prevPage,
    sort,
    setSort,
    genre,
    setGenre,
    resetFilters,
    availableGenres,
  } = useBookSearch({
    initialQuery: urlQuery || "book",
    limit: 20,
    debounceMs: 400,
  });

  useEffect(() => {
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [urlQuery, query, setQuery]);

  const handleSearchSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query) {
      setSearchParams({ q: query });
    }
  };

  let resultsCountText = "No books found";
  if (total > 0) {
    resultsCountText = `${total} books found`;
  } else if (isLoading) {
    resultsCountText = "Searching...";
  }

  const renderResults = () => {
    if (isLoading) {
      return <Catalog isLoading={true} skeletonCount={12} />;
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/10 p-8 text-center text-destructive">
          <p className="font-medium text-sm">
            {error?.message || "An error occurred while loading books."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(1)}
            className="mt-3"
          >
            Try again
          </Button>
        </div>
      );
    }

    if (books.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground text-base">
            No books found for "{query}".
          </p>
        </div>
      );
    }

    return <Catalog books={books} />;
  };

  return (
    <article className="flex min-h-[calc(100svh-4.3rem)] flex-col items-center justify-start gap-8 bg-muted p-6 md:p-10">
      <section className="flex w-full max-w-4xl flex-col items-center gap-4 text-center">
        <div className="w-full max-w-lg">
          <SearchBar
            value={query}
            onValueChange={(e) => setQuery(e.target.value)}
            onSubmit={handleSearchSubmit}
            placeholder="Search books in Open Library..."
          />
        </div>
      </section>

      <SearchControlsBar
        sort={sort}
        onSortChange={setSort}
        genre={genre}
        onGenreChange={setGenre}
        availableGenres={availableGenres}
        onResetFilters={resetFilters}
        resultsCountText={resultsCountText}
        isFetching={isFetching}
      />

      <section className="flex w-full max-w-7xl flex-col gap-6">
        {renderResults()}
      </section>

      {!isLoading && !isError && totalPages > 1 && (
        <section className="flex items-center justify-center gap-4 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={prevPage}
            disabled={page <= 1 || isFetching}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <span className="text-sm text-muted-foreground font-medium">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={nextPage}
            disabled={!hasMore || isFetching}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </section>
      )}
    </article>
  );
}

export default SearchPage;
