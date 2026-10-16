import { useState } from "react";
import { useNavigate } from "react-router";
import SearchBar from "../components/layout/SearchBar";
import Catalog from "@/components/layout/Catalog";
import { useHomeCatalog } from "@/hooks/useHomeCatalog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Flame, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";

function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState<string>("");

  const { trending, categories, isLoading, isError, error, refetch } =
    useHomeCatalog({ limitPerCategory: 10 });

  const handleSearch = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;
    navigate(`/search?q=${encodeURIComponent(cleanQuery)}`);
  };

  return (
    <article className="flex min-h-[calc(100svh-4.3rem)] flex-col items-center justify-start gap-8 bg-muted p-6 md:p-10">
      <Card className="flex w-[95dvw] max-w-4xl py-10 flex-col items-center gap-4 text-center">
        <h1 className="text-3xl py-4 font-extrabold tracking-tight md:text-5xl">
          Discover Your Next Great Read
        </h1>
        <p className="max-w-xl text-md font-medium py-2 md:text-xl">
          Explore trending books and browse through curated genres.
        </p>
        <div className="w-[calc(100%-2rem)] max-w-md pb-4 pt-2">
          <SearchBar
            value={query}
            onValueChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setQuery(event.target.value)
            }
            onSubmit={handleSearch}
            placeholder="Search by title, author, or genre..."
            className="pt-5"
          />
        </div>
      </Card>

      {isError && (
        <section className="flex max-w-md flex-col items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
          <p className="font-medium text-sm">
            {error?.message || "Failed to load the book catalog."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </section>
      )}

      {isLoading ? (
        <div className="flex w-full max-w-7xl flex-col gap-12">
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Flame className="h-6 w-6 text-orange-500 animate-pulse" />
              <h2 className="text-2xl font-bold tracking-tight">
                Trending Books
              </h2>
              <span className="ml-auto text-xs text-muted-foreground">
                Loading...
              </span>
            </div>
            <Catalog isLoading={true} skeletonCount={6} />
          </section>

          {["Fiction", "Fantasy"].map((genreName) => (
            <section key={genreName} className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <BookOpen className="h-6 w-6 text-primary animate-pulse" />
                <h2 className="text-2xl font-bold tracking-tight">
                  {genreName}
                </h2>
                <span className="ml-auto text-xs text-muted-foreground">
                  Loading...
                </span>
              </div>
              <Catalog isLoading={true} skeletonCount={6} />
            </section>
          ))}
        </div>
      ) : (
        !isError && (
          <div className="flex w-full max-w-7xl flex-col gap-12">
            {trending.length > 0 && (
              <section className="flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Flame className="h-6 w-6 text-orange-500" />
                  <h2 className="text-2xl font-bold tracking-tight">
                    Trending Books
                  </h2>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {trending.length} books
                  </span>
                </div>
                <Catalog books={trending} />
              </section>
            )}

            {categories.map((cat) => {
              if (cat.books.length === 0) return null;
              return (
                <section key={cat.category} className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold tracking-tight">
                      {cat.categoryLabel}
                    </h2>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {cat.books.length} books
                    </span>
                  </div>
                  <Catalog books={cat.books} />
                </section>
              );
            })}
          </div>
        )
      )}
    </article>
  );
}

export default Home;
