import { useState } from "react";
import type { BookDetails } from "@/type/book";
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
import { useLoanActions } from "@/hooks/useLoanActions";
import { defaultDueDate, toLocalDateInput } from "./loanDates";

export interface BorrowBookDialogProps {
  readonly book: BookDetails;
  readonly onOpenChange: (open: boolean) => void;
  open: boolean;
}

function BorrowBookForm({
  book,
  onOpenChange,
}: Pick<BorrowBookDialogProps, "book" | "onOpenChange">) {
  const { borrowBook, isSubmittingBorrow, isErrorBorrow, borrowError } =
    useLoanActions();
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const today = toLocalDateInput(new Date());

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    borrowBook(
      {
        book: { id: book.id, title: book.title, author: book.author },
        dueDate,
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="due-date">Return deadline</Label>
        <Input
          id="due-date"
          type="date"
          value={dueDate}
          min={today}
          required
          onChange={(event) => setDueDate(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          The book must be returned by this date.
        </p>
      </div>
      {isErrorBorrow && (
        <p className="text-sm text-destructive">{borrowError?.message}</p>
      )}
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmittingBorrow}>
          {isSubmittingBorrow ? "Borrowing..." : "Confirm borrow"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function BorrowBookDialog({
  book,
  open,
  onOpenChange,
}: Readonly<BorrowBookDialogProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Borrow &quot;{book.title}&quot;</DialogTitle>
          <DialogDescription>
            Choose the deadline to return the book.
          </DialogDescription>
        </DialogHeader>
        <BorrowBookForm book={book} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}

export default BorrowBookDialog;
