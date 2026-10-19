import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loanService } from "../services/loanService";
import type { BorrowBookInput, Loan } from "../type/loan";

export function useLoanActions() {
  const queryClient = useQueryClient();

  const borrowMutation = useMutation<Loan, Error, BorrowBookInput>({
    mutationFn: (input) => loanService.borrowBook(input),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["loans"] }),
  });

  const returnMutation = useMutation<Loan, Error, string>({
    mutationFn: (loanId) => loanService.returnBook(loanId),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["loans"] }),
  });

  return {
    borrowBook: borrowMutation.mutate,
    isSubmittingBorrow: borrowMutation.isPending,
    isErrorBorrow: borrowMutation.isError,
    borrowError: borrowMutation.error,
    returnBook: returnMutation.mutate,
    isSubmittingReturn: returnMutation.isPending,
    isErrorReturn: returnMutation.isError,
    returnError: returnMutation.error,
  };
}
