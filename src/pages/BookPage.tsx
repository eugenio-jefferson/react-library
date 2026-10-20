import { useNavigate, useParams } from "react-router";
import { ArrowLeft, BookBookmarkIcon, BookUp, Heart } from "lucide-react";
import { useBookDetails } from "@/hooks/useBookDetails";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/hooks/useAuthSession";
import BorrowBookDialog from "@/components/loan/BorrowBookDialog";
import { useBookLoanInfo } from "@/hooks/useBookLoanInfo";
import { formatLoanDate, isOverdue } from "@/components/loan/loanDates";
import LoanBadge, { type LoanBadgeState } from "@/components/loan/LoanBadge";
import ReturnBookDialog from "@/components/loan/ReturnBookDialog";
import { useBookWishlistStatus } from "@/hooks/useBookWishlistStatus";
import AddToWishlistDialog from "@/components/wishlist/AddToWishlistDialog";

function BookPageSkeleton() {
  return (
    <article className="flex min-h-[calc(100svh-4.3rem)] flex-col items-center justify-start gap-8 p-5 md:p-10">
      <header className="flex w-full">
        <Skeleton className="h-4 w-30" />
      </header>
      <section className="flex w-full flex-col gap-8">
        <Card className="flex w-full flex-col items-center gap-6 border border-muted-foreground/30 shadow-lg">
          <CardHeader className="w-full justify-center pt-5 pb-5">
            <Skeleton className="aspect-2/3 w-48 shrink-0 rounded-lg md:w-64" />
          </CardHeader>
          <CardContent className="flex w-full flex-col gap-6 pl-15 pr-15 items-center">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-6 w-40" />
          </CardContent>
        </Card>
        <Card className="flex w-full flex-col gap-6 items-center border border-muted-foreground/30 shadow-lg pt-10 pb-10 pr-2 pl-2">
          <CardTitle className="flex w-full justify-center">
            <Skeleton className="h-4 w-25" />
          </CardTitle>
          <CardContent className="flex w-full flex-col gap-3 items-center">
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-4 w-[70%]" />
          </CardContent>
        </Card>
        <Card className="flex w-full flex-col gap-6 items-center border border-muted-foreground/30 shadow-lg pt-10 pb-10">
          <CardTitle className="flex w-full justify-center">
            <Skeleton className="h-4 w-25" />
          </CardTitle>
          <CardContent className="flex w-full flex-row gap-3 items-center">
            <Skeleton className="h-6 w-[90%]" />
            <Skeleton className="h-6 w-[70%]" />
            <Skeleton className="h-6 w-[65%]" />
            <Skeleton className="h-6 w-[70%]" />
          </CardContent>
        </Card>
      </section>
    </article>
  );
}

export default function BookPage() {
  const navigate = useNavigate();

  const { id } = useParams<{ id: string }>();
  const {
    book,
    isLoading: isBookLoading,
    isError: isBookError,
    error: bookError,
    refetch,
  } = useBookDetails(id);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuthSession();
  const {
    info,
    isLoading: isLoanInfoLoading,
    isError: isLoanInfoError,
  } = useBookLoanInfo(book?.id, user?.id);
  const { status: wishlistStatus } = useBookWishlistStatus(book?.id, user?.id);

  const activeLoan = info?.activeLoan ?? null;
  const overdue = activeLoan ? isOverdue(activeLoan.due_date) : false;
  const unavailable =
    activeLoan &&
    info != null &&
    info.availableCopies !== null &&
    info.availableCopies <= 0;
  const inWishlist = wishlistStatus?.isInWishlist ?? false;
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  const goBack = () => {
    navigate(-1);
  };

  const handleBorrowClick = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    setBorrowOpen(true);
  };

  const handleWishlistClick = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    setWishlistOpen(true);
  };

  const badgeState = (): LoanBadgeState => {
    if (activeLoan) return overdue ? "overdue" : "borrowed";
    if (unavailable) return "unavailable";
    return "available";
  };

  if (isBookLoading || isAuthLoading || isLoanInfoLoading)
    return <BookPageSkeleton />;

  const renderContent = () => {
    if (isBookError || isLoanInfoError) {
      return (
        <Card className="flex flex-col items-center justify-center border border-destructive/30 bg-destructive/10 p-8 text-center text-destructive">
          <p className="text-sm font-medium">
            {bookError?.message ||
              "An error occurred while loading this book data."}
          </p>
          <Button
            variant="destructive"
            size="lg"
            onClick={() => refetch()}
            className="mt-3"
          >
            Try again
          </Button>
        </Card>
      );
    }

    if (!book) {
      return (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <p className="text-base">
            No book found for the given ID. <br /> Check the ID and/or try again
            later.
          </p>
        </Card>
      );
    }

    return (
      <section className="flex w-full flex-col gap-8">
        <Card className="flex w-full flex-col items-center gap-6 border border-muted-foreground/30 shadow-lg">
          <CardHeader className="flex w-full justify-center pt-5 pb-5">
            {!imageLoaded && (
              <Skeleton className="aspect-2/3 w-48 shrink-0 rounded-lg md:w-64" />
            )}
            <img
              src={book.cover_image}
              loading="lazy"
              alt={book.title}
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              className={`aspect-2/3 max-w-2/3 shrink-0 rounded-lg md:w-64 ${imageLoaded ? "visible" : "invisible"}`}
            />
          </CardHeader>
          <CardContent className="flex w-full flex-col gap-4 pl-15 pr-15 items-center">
            <h1 className="font-bold text-2xl text-center">{book.title}</h1>
            <p className="text-base font-medium text-center">{book.author}</p>
            <p className="text-base font-medium text-center text-muted-foreground">
              {book.publish_date}
            </p>
            <LoanBadge state={badgeState()} className="text-md" />
            {activeLoan ? (
              <p className="text-sm text-muted-foreground text-center">
                Return on{" "}
                <span
                  className={
                    overdue
                      ? "font-semibold text-destructive"
                      : "font-medium text-foreground"
                  }
                >
                  {formatLoanDate(activeLoan.due_date)}
                </span>
              </p>
            ) : (
              <></>
            )}
          </CardContent>
          <CardFooter className="flex w-full flex-col items-center gap-3 pt-8 pb-8">
            <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
              {!activeLoan ? (
                <Button
                  size="lg"
                  onClick={handleBorrowClick}
                  disabled={Boolean(unavailable)}
                  className="w-full h-10 text-xl sm:w-60"
                >
                  <BookBookmarkIcon className="size-6" />
                  <span className="pl-3">Borrow this book</span>
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => setReturnOpen(true)}
                  className="w-full h-10 text-xl sm:w-60"
                  variant="secondary"
                >
                  <BookUp className="size-6" />
                  <span className="pl-3">Return this book</span>
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                onClick={handleWishlistClick}
                className="cursor-pointer w-full h-10 text-xl sm:w-60"
              >
                <Heart
                  className="size-6"
                  fill={inWishlist ? "currentColor" : "none"}
                />
                <span className="pl-3">
                  {inWishlist ? "In your wish lists" : "Add to wish list"}
                </span>
              </Button>
            </div>
            {activeLoan ? (
              <ReturnBookDialog
                loan={activeLoan}
                bookTitle={book.title}
                open={returnOpen}
                onOpenChange={setReturnOpen}
              />
            ) : (
              <BorrowBookDialog
                book={book}
                open={borrowOpen}
                onOpenChange={setBorrowOpen}
              />
            )}
            <AddToWishlistDialog
              book={book}
              memberships={wishlistStatus?.memberships}
              open={wishlistOpen}
              onOpenChange={setWishlistOpen}
            />
          </CardFooter>
        </Card>
        <Card className="flex w-full flex-col gap-4 items-center border border-muted-foreground/30 shadow-lg pt-10 pb-10 pr-4 pl-4">
          <CardTitle className="flex w-full justify-center">
            <h1 className="font-bold text-muted-foreground">DESCRIPTION</h1>
          </CardTitle>
          <CardContent className="flex w-full flex-col gap-3 items-center">
            <p className="text-center">{book.description}</p>
          </CardContent>
        </Card>
        <Card className="flex w-full flex-col gap-4 items-center border border-muted-foreground/30 shadow-lg pt-10 pb-10 pr-1 pl-1">
          <CardTitle className="flex w-full justify-center">
            <h1 className="font-bold text-muted-foreground">SUBJECTS</h1>
          </CardTitle>
          <CardContent className="flex w-full flex-wrap gap-3 justify-center">
            {book.subjects.slice(0, 8).map((subject) => (
              <span
                key={`${subject}-${book.id}`}
                className="rounded-full border px-3 py-1 text-xs"
              >
                {subject}
              </span>
            ))}
          </CardContent>
        </Card>
      </section>
    );
  };

  return (
    <article className="flex min-h-[calc(100svh-4.3rem)] flex-col items-center justify-start gap-5 p-5 md:p-10 bg-muted">
      <header className="mx-auto flex w-full max-w-4xl flex-col">
        <Button
          variant="ghost"
          onClick={goBack}
          className="flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </header>
      {renderContent()}
    </article>
  );
}
