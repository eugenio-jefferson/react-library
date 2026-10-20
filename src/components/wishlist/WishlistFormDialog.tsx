import { useState } from "react";
import type { Wishlist } from "@/type/wishlist";
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
import { useWishlistActions } from "@/hooks/useWishlistActions";
import { sanitizeText } from "@/utils/sanitize";
import {
  MAX_WISHLIST_NAME_LENGTH,
  validateWishlistName,
} from "@/utils/validation";

export interface WishlistFormDialogProps {
  readonly onOpenChange: (open: boolean) => void;
  readonly wishlist?: Wishlist | null;
  open: boolean;
}

function WishlistFormDialog({
  open,
  onOpenChange,
  wishlist,
}: Readonly<WishlistFormDialogProps>) {
  const {
    createWishlist,
    isCreating,
    isErrorCreate,
    createError,
    renameWishlist,
    isRenaming,
    isErrorRename,
    renameError,
  } = useWishlistActions();
  const [name, setName] = useState(wishlist?.name ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    setName(wishlist?.name ?? "");
    setNameError(null);
  }

  const isRenamingWishlist = Boolean(wishlist);
  const isSubmitting = isCreating || isRenaming;

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateWishlistName(name);
    setNameError(validationError);
    if (validationError) return;

    const sanitizedName = sanitizeText(name, MAX_WISHLIST_NAME_LENGTH);

    if (isRenamingWishlist && wishlist) {
      renameWishlist(
        { wishlistId: wishlist.id, name: sanitizedName },
        {
          onSuccess: () => onOpenChange(false),
        },
      );
      return;
    }

    createWishlist(sanitizedName, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isRenamingWishlist ? "Rename wish list" : "New wish list"}
          </DialogTitle>
          <DialogDescription>
            {isRenamingWishlist
              ? "Choose a new name for this wish list."
              : "Give your wish list a name so you can organize your books."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="wishlist-name">Wish list name</Label>
            <Input
              id="wishlist-name"
              value={name}
              placeholder="e.g. Study Materials"
              maxLength={MAX_WISHLIST_NAME_LENGTH}
              required
              onChange={(event) => {
                setName(event.target.value);
                setNameError(null);
              }}
              aria-invalid={Boolean(nameError)}
              aria-describedby={
                nameError ? "wishlist-name-error" : "wishlist-name-hint"
              }
            />
            <p id="wishlist-name-hint" className="text-xs text-muted-foreground">
              Up to {MAX_WISHLIST_NAME_LENGTH} characters.
            </p>
            {nameError && (
              <p id="wishlist-name-error" role="alert" className="text-sm text-destructive">
                {nameError}
              </p>
            )}
          </div>
          {(isErrorCreate || isErrorRename) && (
            <p role="alert" className="text-sm text-destructive">
              {isRenamingWishlist
                ? renameError?.message
                : createError?.message}
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isRenamingWishlist
                  ? "Renaming..."
                  : "Creating..."
                : isRenamingWishlist
                  ? "Save changes"
                  : "Create wish list"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default WishlistFormDialog;
