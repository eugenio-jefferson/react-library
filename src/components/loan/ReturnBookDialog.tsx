import type { Loan } from "@/type/loan";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLoanActions } from "@/hooks/useLoanActions";
import { formatLoanDate } from "./loanDates";

export interface ReturnBookDialogProps {
  loan: Loan;
  bookTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ReturnBookDialog({
  loan,
  bookTitle,
  open,
  onOpenChange,
}: Readonly<ReturnBookDialogProps>) {
  const { returnBook, isSubmittingReturn, isErrorReturn, returnError } =
    useLoanActions();

  const handleConfirm = () => {
    returnBook(loan.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Return this book?</DialogTitle>
          <DialogDescription>
            You&apos;re about to return &quot;{bookTitle}&quot;. The loan was
            due on {formatLoanDate(loan.due_date)}.
          </DialogDescription>
        </DialogHeader>
        {isErrorReturn && (
          <p className="text-sm text-destructive">{returnError?.message}</p>
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
            onClick={handleConfirm}
            disabled={isSubmittingReturn}
          >
            {isSubmittingReturn ? "Returning..." : "Confirm return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReturnBookDialog;
