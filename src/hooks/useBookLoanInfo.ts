import { useQuery } from "@tanstack/react-query";
import { loanService } from "../services/loanService";
import type { BookLoanInfo } from "../type/loan";

export interface UseBookLoanInfoResult {
  info: BookLoanInfo | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export function useBookLoanInfo(
  workId: string | undefined,
  userId: string | null | undefined,
): UseBookLoanInfoResult {
  const bookId = workId?.trim();
  const queryUserId = userId ?? null;

  const { data, isLoading, isError, error, refetch } = useQuery<
    BookLoanInfo,
    Error
  >({
    queryKey: ["loans", "book", bookId, queryUserId],
    queryFn: () => loanService.getBookLoanInfo(bookId as string, queryUserId),
    enabled: Boolean(bookId),
  });

  return {
    info: data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
