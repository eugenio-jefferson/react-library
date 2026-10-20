import { useState } from "react";
import type { BookDetails } from "@/type/book";
import type { WishlistMembership } from "@/type/wishlist";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useWishlists } from "@/hooks/useWishlists";
import { useWishlistActions } from "@/hooks/useWishlistActions";

const CREATE_NEW_VALUE = "__create_new__";

export interface AddToWishlistDialogProps {
  readonly book: BookDetails;
  readonly memberships?: WishlistMembership[];
  readonly onOpenChange: (open: boolean) => void;
  open: boolean;
}

function AddToWishlistForm({
  book,
  memberships,
  onOpenChange,
}: Pick<AddToWishlistDialogProps, "book" | "memberships" | "onOpenChange">) {
  const { user } = useAuthSession();
  const { wishlists, isLoading } = useWishlists(user?.id);
  const {
    addBook,
    isAdding,
    isErrorAdd,
    addError,
    createWishlist,
    isCreating,
    isErrorCreate,
    createError,
    removeBook,
    isRemoving,
    isErrorRemove,
    removeError,
  } = useWishlistActions();

  const allWishlists = wishlists ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const [newListName, setNewListName] = useState("");

  const effectiveSelectedId = isLoading
    ? null
    : (selected ?? allWishlists[0]?.wishlist.id ?? CREATE_NEW_VALUE);

  const isCreateNew = effectiveSelectedId === CREATE_NEW_VALUE;
  const selectedMembership =
    memberships?.find(
      (membership) => membership.wishlistId === effectiveSelectedId,
    ) ?? null;

  const selectItems = [
    ...allWishlists.map(({ wishlist }) => ({
      value: wishlist.id,
      label: wishlist.name,
    })),
    { value: CREATE_NEW_VALUE, label: "Create new wish list…" },
  ];

  const isBusy = isAdding || isCreating || isRemoving;

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isCreateNew) {
      createWishlist(newListName, {
        onSuccess: (created) => {
          setNewListName("");
          addBook(
            {
              wishlistId: created.id,
              book: { id: book.id, title: book.title, author: book.author },
            },
            {
              onSuccess: () => onOpenChange(false),
            },
          );
        },
      });
      return;
    }

    if (!effectiveSelectedId) return;

    addBook(
      {
        wishlistId: effectiveSelectedId,
        book: { id: book.id, title: book.title, author: book.author },
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  const handleRemove = () => {
    if (!selectedMembership) return;

    removeBook(selectedMembership.itemId, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="wishlist-select">Choose a wish list</Label>
            <Select
              value={effectiveSelectedId}
              onValueChange={setSelected}
              items={selectItems}
            >
              <SelectTrigger id="wishlist-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allWishlists.map(({ wishlist, items }) => {
                  const alreadyAdded = memberships?.some(
                    (membership) => membership.wishlistId === wishlist.id,
                  );
                  return (
                    <SelectItem key={wishlist.id} value={wishlist.id}>
                      {wishlist.name} ({items.length})
                      {alreadyAdded ? " · already added" : ""}
                    </SelectItem>
                  );
                })}
                {allWishlists.length > 0 && <SelectSeparator />}
                <SelectItem value={CREATE_NEW_VALUE}>
                  Create new wish list…
                </SelectItem>
              </SelectContent>
            </Select>
            {selectedMembership && (
              <p className="text-xs text-muted-foreground">
                This book is already in this wish list.
              </p>
            )}
          </div>
          {isCreateNew && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-wishlist-name">New wish list name</Label>
              <Input
                id="new-wishlist-name"
                value={newListName}
                placeholder="e.g. Sci-Fi Must Reads"
                maxLength={100}
                required
                onChange={(event) => setNewListName(event.target.value)}
              />
            </div>
          )}
        </>
      )}
      {(isErrorAdd || isErrorCreate || isErrorRemove) && (
        <p className="text-sm text-destructive">
          {addError?.message || createError?.message || removeError?.message}
        </p>
      )}
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        {isCreateNew ? (
          <Button type="submit" disabled={isBusy}>
            {isCreating ? "Creating..." : "Create and add"}
          </Button>
        ) : selectedMembership ? (
          <Button
            type="button"
            variant="destructive"
            onClick={handleRemove}
            disabled={isBusy}
          >
            {isRemoving ? "Removing..." : "Remove from list"}
          </Button>
        ) : (
          <Button type="submit" disabled={isBusy}>
            {isAdding ? "Adding..." : "Add to list"}
          </Button>
        )}
      </DialogFooter>
    </form>
  );
}

function AddToWishlistDialog({
  book,
  memberships,
  open,
  onOpenChange,
}: Readonly<AddToWishlistDialogProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Add the book &quot;{book.title}&quot; to a wish list
          </DialogTitle>
          <DialogDescription>
            Pick one of your wish lists or create a new one.
          </DialogDescription>
        </DialogHeader>
        <AddToWishlistForm
          book={book}
          memberships={memberships}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}

export default AddToWishlistDialog;
