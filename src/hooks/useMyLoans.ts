import { useQuery } from "@tanstack/react-query";
import { loanService } from "../services/loanService";
import type { LoanWithBook } from "../type/loan";

export interface UseMyLoansResult {
  loans: LoanWithBook[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export function useMyLoans(
  userId: string | null | undefined = null,
): UseMyLoansResult {
  const { data, isLoading, isError, error, refetch } = useQuery<
    LoanWithBook[],
    Error
  >({
    queryKey: ["loans", userId],
    queryFn: () => loanService.getMyLoans(userId as string),
    enabled: Boolean(userId),
  });

  return {
    loans: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
