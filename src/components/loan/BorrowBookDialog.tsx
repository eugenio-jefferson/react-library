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
import { validateDueDate } from "@/utils/validation";
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
  const [dueDateError, setDueDateError] = useState<string | null>(null);
  const today = toLocalDateInput(new Date());

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateDueDate(dueDate);
    setDueDateError(validationError);
    if (validationError) return;

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
          onChange={(event) => {
            setDueDate(event.target.value);
            setDueDateError(null);
          }}
          aria-invalid={Boolean(dueDateError)}
          aria-describedby={
            dueDateError ? "due-date-error" : "due-date-hint"
          }
        />
        <p id="due-date-hint" className="text-xs text-muted-foreground">
          The book must be returned by this date.
        </p>
        {dueDateError && (
          <p
            id="due-date-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {dueDateError}
          </p>
        )}
      </div>
      {isErrorBorrow && (
        <p role="alert" className="text-sm text-destructive">
          {borrowError?.message}
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
