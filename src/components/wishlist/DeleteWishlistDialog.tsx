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
import { useWishlistActions } from "@/hooks/useWishlistActions";

export interface DeleteWishlistDialogProps {
  readonly onOpenChange: (open: boolean) => void;
  readonly wishlist: Wishlist | null;
  open: boolean;
}

function DeleteWishlistDialog({
  open,
  onOpenChange,
  wishlist,
}: Readonly<DeleteWishlistDialogProps>) {
  const { deleteWishlist, isDeleting, isErrorDelete, deleteError } =
    useWishlistActions();

  const handleDelete = () => {
    if (!wishlist) return;

    deleteWishlist(wishlist.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &quot;{wishlist?.name}&quot;?</DialogTitle>
          <DialogDescription>
            This will permanently remove the wish list and all of its books.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {isErrorDelete && (
          <p className="text-sm text-destructive">{deleteError?.message}</p>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete wish list"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteWishlistDialog;
