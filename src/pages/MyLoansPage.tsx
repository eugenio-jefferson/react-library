import { useState } from "react";
import { Link, Navigate } from "react-router";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useMyLoans } from "@/hooks/useMyLoans";
import ReturnBookDialog from "@/components/loan/ReturnBookDialog";
import LoanBadge from "@/components/loan/LoanBadge";
import { formatLoanDate, isOverdue } from "@/components/loan/loanDates";
import type { LoanWithBook } from "@/type/loan";

function MyLoansSkeleton() {
  return (
    <>
      {[0, 1, 2].map((index) => (
        <Card key={index} className="w-full p-5">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </Card>
      ))}
    </>
  );
}

function MyLoansPage() {
  const { user, isLoading: isAuthLoading } = useAuthSession();
  const { loans, isLoading, isError, error, refetch } = useMyLoans(user?.id);
  const [returning, setReturning] = useState<LoanWithBook | null>(null);

  const allLoans = loans ?? [];
  const activeLoans = allLoans.filter(
    (entry) => entry.loan.status !== "returned",
  );
  const returnedLoans = allLoans.filter(
    (entry) => entry.loan.status === "returned",
  );

  const renderLoanCard = (entry: LoanWithBook, showReturnButton: boolean) => {
    const { loan, book } = entry;
    const overdue = loan.status !== "returned" && isOverdue(loan.due_date);

    return (
      <Card
        key={loan.id}
        className="flex w-full flex-col gap-4 border border-muted-foreground/30 p-5 shadow-lg sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-1">
          <h2 className="font-bold text-lg">{book.title}</h2>
          <p className="text-sm font-medium text-muted-foreground">
            {book.author}
          </p>
          <p className="text-sm">
            Borrowed on {formatLoanDate(loan.borrowed_at)}
          </p>
          <p className="text-sm">
            Return by{" "}
            <span
              className={
                overdue
                  ? "font-semibold text-destructive"
                  : "font-medium text-foreground"
              }
            >
              {formatLoanDate(loan.due_date)}
            </span>
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <LoanBadge
            state={
              loan.status === "returned"
                ? "returned"
                : overdue
                  ? "overdue"
                  : "borrowed"
            }
          />
          {showReturnButton && (
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Button
                render={<Link to={`/books/${book.work_id}/read`} />}
                className="cursor-pointer"
              >
                Read book
              </Button>
              <Button onClick={() => setReturning(entry)}>Return book</Button>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderBody = () => {
    if (isLoading) {
      return <MyLoansSkeleton />;
    }

    if (isError) {
      return (
        <Card className="flex flex-col items-center justify-center border border-destructive/30 bg-destructive/10 p-8 text-center text-destructive">
          <p className="text-sm font-medium">
            {error?.message || "An error occurred while loading your loans."}
          </p>
          <Button
            variant="destructive"
            size="lg"
            className="mt-3"
            onClick={() => refetch()}
          >
            Try again
          </Button>
        </Card>
      );
    }

    if (allLoans.length === 0) {
      return (
        <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <p className="text-base">You haven&apos;t borrowed any books yet.</p>
          <Button render={<Link to="/search" />} variant="outline">
            Browse the catalog
          </Button>
        </Card>
      );
    }

    return (
      <>
        <section className="flex w-full flex-col gap-4">
          <h2 className="font-bold text-muted-foreground">CURRENT LOANS</h2>
          {activeLoans.length === 0 ? (
            <Card className="w-full p-5 text-center text-sm text-muted-foreground">
              You have no active loans right now.
            </Card>
          ) : (
            activeLoans.map((entry) => renderLoanCard(entry, true))
          )}
        </section>
        {returnedLoans.length > 0 && (
          <section className="flex w-full flex-col gap-4">
            <h2 className="font-bold text-muted-foreground">HISTORY</h2>
            {returnedLoans.map((entry) => renderLoanCard(entry, false))}
          </section>
        )}
      </>
    );
  };

  if (isAuthLoading) {
    return (
      <article className="flex min-h-[calc(100svh-4.3rem)] items-center justify-center bg-muted">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </article>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: "/loans" }} />;
  }

  return (
    <article className="flex min-h-[calc(100svh-4.3rem)] flex-col items-center justify-start gap-5 bg-muted p-4 sm:p-5 md:p-10">
      <section className="flex w-full max-w-4xl flex-col gap-6">
        <Card className="flex w-full flex-col gap-1 border border-muted-foreground/30 p-5 shadow-lg">
          <CardHeader className="p-0">
            <CardTitle className="text-2xl font-bold">My Loans</CardTitle>
            <CardDescription>
              Books you&apos;ve borrowed and their return deadlines.
            </CardDescription>
          </CardHeader>
        </Card>
        {renderBody()}
      </section>
      {returning && (
        <ReturnBookDialog
          loan={returning.loan}
          bookTitle={returning.book.title}
          open
          onOpenChange={(open) => {
            if (!open) setReturning(null);
          }}
        />
      )}
    </article>
  );
}

export default MyLoansPage;
