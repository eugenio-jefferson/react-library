import { useState } from "react";
import { Link, Navigate } from "react-router";
import { Plus } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useWishlists } from "@/hooks/useWishlists";
import { useWishlistActions } from "@/hooks/useWishlistActions";
import WishlistFormDialog from "@/components/wishlist/WishlistFormDialog";
import DeleteWishlistDialog from "@/components/wishlist/DeleteWishlistDialog";
import LoanBadge from "@/components/loan/LoanBadge";
import { formatLoanDate } from "@/components/loan/loanDates";
import type { Wishlist, WishlistWithItems } from "@/type/wishlist";

function WishlistsSkeleton() {
  return (
    <>
      {[0, 1, 2].map((index) => (
        <Card key={index} className="w-full p-5">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </Card>
      ))}
    </>
  );
}

function WishlistsPage() {
  const { user, isLoading: isAuthLoading } = useAuthSession();
  const { wishlists, isLoading, isError, error, refetch } = useWishlists(
    user?.id,
  );
  const { removeBook, isRemoving, removeError, isErrorRemove } =
    useWishlistActions();

  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<Wishlist | null>(null);
  const [deleting, setDeleting] = useState<Wishlist | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allWishlists = wishlists ?? [];

  const renderWishlistCard = (entry: WishlistWithItems) => {
    const { wishlist, items } = entry;
    const isExpanded = expandedId === wishlist.id;

    return (
      <Card
        key={wishlist.id}
        className="flex w-full flex-col gap-4 border border-muted-foreground/30 p-5 shadow-lg"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="font-bold text-lg">{wishlist.name}</h2>
            <p className="text-sm text-muted-foreground">
              Created on {formatLoanDate(wishlist.created_at)} · {items.length}{" "}
              {items.length === 1 ? "book" : "books"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedId(isExpanded ? null : wishlist.id)}
            >
              {isExpanded ? "Hide books" : "View books"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRenaming(wishlist)}
            >
              Rename
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleting(wishlist)}
            >
              Delete
            </Button>
          </div>
        </div>
        {isExpanded && (
          <div className="flex flex-col gap-2">
            {items.length === 0 ? (
              <p className="rounded-lg border border-muted-foreground/20 p-3 text-sm text-muted-foreground">
                This wish list is empty. Find a book in the catalog and add it
                to your wish list.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-lg border border-muted-foreground/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col">
                    <Link
                      to={`/books/${item.book.work_id}`}
                      className="font-medium hover:text-primary"
                    >
                      {item.book.title}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {item.book.author}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LoanBadge
                      state={
                        item.book.available_copies > 0
                          ? "available"
                          : "unavailable"
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isRemoving}
                      onClick={() => removeBook(item.id)}
                    >
                      {isRemoving ? "Removing..." : "Remove"}
                    </Button>
                  </div>
                </div>
              ))
            )}
            {isErrorRemove && (
              <p className="text-sm text-destructive">{removeError?.message}</p>
            )}
          </div>
        )}
      </Card>
    );
  };

  const renderBody = () => {
    if (isLoading) {
      return <WishlistsSkeleton />;
    }

    if (isError) {
      return (
        <Card className="flex flex-col items-center justify-center border border-destructive/30 bg-destructive/10 p-8 text-center text-destructive">
          <p className="text-sm font-medium">
            {error?.message ||
              "An error occurred while loading your wish lists."}
          </p>
          <Button
            variant="destructive"
            size="lg"
            className="mt-3"
            onClick={() => refetch()}
          >
            Try again
          </Button>
        </Card>
      );
    }

    if (allWishlists.length === 0) {
      return (
        <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <p className="text-base">
            You haven&apos;t created any wish lists yet.
          </p>
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Create your first wish list
          </Button>
          <Button render={<Link to="/search" />} variant="outline">
            Browse the catalog
          </Button>
        </Card>
      );
    }

    return <>{allWishlists.map((entry) => renderWishlistCard(entry))}</>;
  };

  if (isAuthLoading) {
    return (
      <article className="flex min-h-[calc(100svh-4.3rem)] items-center justify-center bg-muted">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </article>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: "/wishlists" }} />;
  }

  return (
    <article className="flex min-h-[calc(100svh-15rem)] flex-col items-center justify-start gap-5 bg-muted p-4 sm:p-5 md:p-10">
      <section className="flex w-full max-w-4xl flex-col gap-6">
        <Card className="flex w-full flex-col gap-3 border border-muted-foreground/30 p-5 shadow-lg">
          <CardHeader className="p-0">
            <CardTitle className="text-2xl font-bold">My Wish Lists</CardTitle>
            <CardDescription>
              Books you want to read. You&apos;ll be notified when one becomes
              available to borrow.
            </CardDescription>
          </CardHeader>
          <Button className="w-fit" onClick={() => setCreating(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New wish list
          </Button>
        </Card>
        {renderBody()}
      </section>
      <WishlistFormDialog
        open={creating}
        onOpenChange={(open) => {
          if (!open) setCreating(false);
        }}
      />
      <WishlistFormDialog
        open={renaming !== null}
        wishlist={renaming}
        onOpenChange={(open) => {
          if (!open) setRenaming(null);
        }}
      />
      <DeleteWishlistDialog
        open={deleting !== null}
        wishlist={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </article>
  );
}

export default WishlistsPage;
