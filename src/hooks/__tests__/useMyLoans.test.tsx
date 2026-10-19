import React from "react";
import { jest } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMyLoans } from "../useMyLoans";
import { loanService } from "../../services/loanService";
import type { LoanWithBook } from "../../type/loan";

describe("useMyLoans", () => {
  let queryClient: QueryClient;

  const sampleLoans: LoanWithBook[] = [
    {
      loan: {
        id: "loan-1",
        user_id: "user-1",
        book_id: "book-1",
        borrowed_at: "2026-10-18T10:00:00.000Z",
        due_date: "2026-11-01T00:00:00.000Z",
        returned_at: null,
        status: "active",
        reading_progress: "reading",
        created_at: "2026-10-18T10:00:00.000Z",
      },
      book: {
        id: "book-1",
        work_id: "OL101W",
        title: "Clean Architecture",
        author: "Robert C. Martin",
        available_copies: 0,
      },
    },
  ];

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("should fetch the loans of the user", async () => {
    const loansSpy = jest
      .spyOn(loanService, "getMyLoans")
      .mockResolvedValueOnce(sampleLoans);

    const { result } = renderHook(() => useMyLoans("user-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(loansSpy).toHaveBeenCalledWith("user-1");
    expect(result.current.loans).toEqual(sampleLoans);
    expect(result.current.isError).toBe(false);
  });

  it("should not fetch when there is no user id", async () => {
    const loansSpy = jest.spyOn(loanService, "getMyLoans");

    const { result } = renderHook(() => useMyLoans(null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(loansSpy).not.toHaveBeenCalled();
    expect(result.current.loans).toBeUndefined();
  });

  it("should expose error state when the service fails", async () => {
    jest
      .spyOn(loanService, "getMyLoans")
      .mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useMyLoans("user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Network error");
    expect(result.current.loans).toBeUndefined();
  });
});
