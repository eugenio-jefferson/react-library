import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  BookUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Library,
} from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useBookDetails } from "@/hooks/useBookDetails";
import { useBookLoanInfo } from "@/hooks/useBookLoanInfo";
import { useReadingSource } from "@/hooks/useReadingSource";
import { useReadingPages } from "@/hooks/useReadingPages";
import { useArchivePreview } from "@/hooks/useArchivePreview";
import { openLibraryService } from "@/services/openLibraryService";
import { formatLoanDate, isOverdue } from "@/components/loan/loanDates";
import ReturnBookDialog from "@/components/loan/ReturnBookDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReadingPages } from "@/type/reading";

function clampPage(value: number, total: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.trunc(value), 0), Math.max(total - 1, 0));
}

function ReadingSkeleton() {
  return (
    <article className="min-h-[calc(100svh-4.3rem)] bg-muted p-3 md:p-5">
      <div className="flex max-w-7xl m-auto w-full flex-col gap-3 ">
        <header className="flex w-full flex-col gap-3 rounded-lg border border-muted-foreground/30 bg-background p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-9 w-28" />
        </header>
        <div className="flex w-full flex-wrap items-center justify-center gap-2 rounded-lg border border-muted-foreground/30 bg-background p-2 shadow-lg">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
        <div className="flex h-[calc(100svh-19rem)] min-h-[55svh] w-full items-center justify-center overflow-hidden rounded-lg border border-muted-foreground/30 bg-background shadow-lg">
          <Skeleton className="aspect-2/3 h-[90%]" />
        </div>
      </div>
    </article>
  );
}

interface BookReaderProps {
  readingPages: ReadingPages;
}

function BookReader({ readingPages }: Readonly<BookReaderProps>) {
  const pages = readingPages.pages;
  const total = readingPages.total;
  const [pageIndex, setPageIndex] = useState(0);
  const [imageAttempt, setImageAttempt] = useState(0);
  const [loadedImage, setLoadedImage] = useState<{
    url: string;
    attempt: number;
  } | null>(null);
  const [failedImage, setFailedImage] = useState<{
    url: string;
    attempt: number;
  } | null>(null);

  const currentPage = pages[pageIndex];

  const imageFailed =
    failedImage?.url === currentPage.imageUrl &&
    failedImage.attempt === imageAttempt;
  const imageReady =
    !imageFailed &&
    loadedImage?.url === currentPage.imageUrl &&
    loadedImage.attempt === imageAttempt;

  useEffect(() => {
    [pageIndex - 1, pageIndex + 1].forEach((neighbor) => {
      const page = pages[neighbor];
      if (page) {
        const img = new Image();
        img.src = page.imageUrl;
      }
    });
  }, [pageIndex, pages]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (event.key === "ArrowRight" || event.key === "PageDown") {
        setPageIndex((current) => clampPage(current + 1, total));
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        setPageIndex((current) => clampPage(current - 1, total));
      } else if (event.key === "Home") {
        setPageIndex(0);
      } else if (event.key === "End") {
        setPageIndex(total - 1);
      } else {
        return;
      }
      event.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [total]);

  const goToPage = (index: number) => setPageIndex(clampPage(index, total));

  return (
    <>
      <div className="flex w-full flex-wrap items-center justify-center gap-2 rounded-lg border border-muted-foreground/30 bg-background p-2 shadow-lg">
        <Button
          variant="outline"
          size="icon"
          aria-label="First page"
          disabled={pageIndex === 0}
          onClick={() => goToPage(0)}
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous page"
          disabled={pageIndex === 0}
          onClick={() => goToPage(pageIndex - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden text-muted-foreground sm:inline">Page</span>
          <Input
            type="number"
            min={1}
            max={total}
            value={pageIndex + 1}
            onChange={(event) => goToPage(Number(event.target.value) - 1)}
            className="w-16 text-center"
            aria-label="Page number"
          />
          <span className="text-muted-foreground">of {total}</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next page"
          disabled={pageIndex >= total - 1}
          onClick={() => goToPage(pageIndex + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Last page"
          disabled={pageIndex >= total - 1}
          onClick={() => goToPage(total - 1)}
        >
          <ChevronsRight className="size-4" />
        </Button>
        {currentPage.label !== String(pageIndex + 1) && (
          <span className="w-full text-center text-xs text-muted-foreground sm:w-auto">
            printed page {currentPage.label}
          </span>
        )}
      </div>

      <div className="relative flex h-[calc(100svh-19rem)] min-h-[55svh] w-full items-center justify-center overflow-hidden rounded-lg border border-muted-foreground/30 bg-background p-3 shadow-lg">
        {imageFailed ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-destructive">
              This page failed to load.
            </p>
            <Button
              variant="outline"
              onClick={() => setImageAttempt((attempt) => attempt + 1)}
            >
              Try again
            </Button>
          </div>
        ) : (
          <>
            {!imageReady && (
              <Skeleton className="absolute inset-0 m-auto aspect-2/3 h-[90%] rounded-md" />
            )}
            <img
              key={`${currentPage.imageUrl}-${imageAttempt}`}
              src={currentPage.imageUrl}
              alt={`Page ${pageIndex + 1} of ${total}`}
              className={`max-h-full max-w-full object-contain transition-opacity duration-200 ${
                imageReady ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() =>
                setLoadedImage({
                  url: currentPage.imageUrl,
                  attempt: imageAttempt,
                })
              }
              onError={() =>
                setFailedImage({
                  url: currentPage.imageUrl,
                  attempt: imageAttempt,
                })
              }
            />
          </>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Use the arrow keys, or the buttons above, to move between pages.
      </p>
    </>
  );
}

export default function ReadingPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const { user, isLoading: isAuthLoading } = useAuthSession();
  const {
    book,
    isLoading: isBookLoading,
    isError: isBookError,
    error: bookError,
    refetch: refetchBook,
  } = useBookDetails(id);
  const {
    info,
    isLoading: isLoanInfoLoading,
    isError: isLoanInfoError,
    error: loanInfoError,
    refetch: refetchLoanInfo,
  } = useBookLoanInfo(id, user?.id);
  const {
    source,
    isLoading: isSourceLoading,
    isError: isSourceError,
    error: sourceError,
    refetch: refetchSource,
  } = useReadingSource(id);
  const {
    pages: readingPages,
    isLoading: isPagesLoading,
    isError: isPagesError,
  } = useReadingPages(source?.iaIdentifier);
  const {
    identifier: previewIdentifier,
    isLoading: isPreviewLoading,
    isError: isPreviewError,
    error: previewError,
    refetch: refetchPreview,
  } = useArchivePreview(
    book?.title,
    book?.author,
    source === null && !isSourceError,
  );

  const [returnOpen, setReturnOpen] = useState(false);
  const [previewEmbedLoaded, setPreviewEmbedLoaded] = useState(false);

  const activeLoan = info?.activeLoan ?? null;
  const overdue = activeLoan ? isOverdue(activeLoan.due_date) : false;

  if (isAuthLoading) return <ReadingSkeleton />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isBookLoading || isLoanInfoLoading) return <ReadingSkeleton />;

  if (isBookError || isLoanInfoError) {
    return (
      <article className="flex min-h-[calc(100svh-4.3rem)] items-center justify-center bg-muted p-5">
        <Card className="flex flex-col items-center justify-center border border-destructive/30 bg-destructive/10 p-8 text-center text-destructive">
          <p className="text-sm font-medium">
            {bookError?.message ||
              loanInfoError?.message ||
              "An error occurred while loading the reading page."}
          </p>
          <Button
            variant="destructive"
            size="lg"
            className="mt-3"
            onClick={() => {
              refetchBook();
              refetchLoanInfo();
            }}
          >
            Try again
          </Button>
        </Card>
      </article>
    );
  }

  if (!book) {
    return (
      <article className="flex min-h-[calc(100svh-4.3rem)] items-center justify-center bg-muted p-5">
        <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <p className="text-base">
            No book found for the given ID. <br /> Check the ID and/or try again
            later.
          </p>
          <Button render={<Link to="/" />} variant="outline">
            Back to home
          </Button>
        </Card>
      </article>
    );
  }

  if (!activeLoan) {
    return <Navigate to={`/books/${book.id}`} replace />;
  }

  if (isSourceLoading || isPreviewLoading) return <ReadingSkeleton />;

  if (isSourceError) {
    return (
      <article className="flex min-h-[calc(100svh-4.3rem)] items-center justify-center bg-muted p-5">
        <Card className="flex flex-col items-center justify-center border border-destructive/30 bg-destructive/10 p-8 text-center text-destructive">
          <p className="text-sm font-medium">
            {sourceError?.message ||
              "An error occurred while loading the book content."}
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <Button
              render={<Link to={`/books/${book.id}`} />}
              variant="outline"
              className="text-foreground"
            >
              Back to book
            </Button>
            <Button
              variant="destructive"
              size="lg"
              onClick={() => refetchSource()}
            >
              Try again
            </Button>
          </div>
        </Card>
      </article>
    );
  }

  const renderHeader = () => (
    <header className="flex w-full flex-col gap-3 rounded-lg border border-muted-foreground/30 bg-background p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between max-w-7xl m-auto">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          render={<Link to={`/books/${book.id}`} />}
          variant="ghost"
          size="icon-lg"
          aria-label="Back to book"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate font-bold text-lg leading-tight">
            {book.title}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {book.author}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Return by{" "}
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
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setReturnOpen(true)}
        >
          <BookUp className="size-4" />
          Return book
        </Button>
      </div>
    </header>
  );

  const renderReturnDialog = () => (
    <ReturnBookDialog
      loan={activeLoan}
      bookTitle={book.title}
      open={returnOpen}
      onOpenChange={setReturnOpen}
    />
  );

  const renderPreview = (identifier: string) => (
    <article className="min-h-[calc(100svh-4.3rem)] bg-muted">
      <div className="flex max-w-7xl m-auto w-full flex-col gap-3 p-3 md:p-5">
        {renderHeader()}
        <div className="flex w-full flex-col items-start justify-between gap-3 rounded-lg border border-muted-foreground/30 bg-background p-3 shadow-lg sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            Showing a{" "}
            <span className="font-medium text-foreground">preview</span> — the
            full text isn&apos;t available for in-app reading.
          </p>
          <Button
            render={
              <a
                href={`https://archive.org/details/${identifier}`}
                target="_blank"
                rel="noreferrer"
              />
            }
            variant="outline"
            size="sm"
            className="shrink-0 cursor-pointer"
          >
            <ExternalLink className="size-4" />
            Open on archive.org
          </Button>
        </div>
        <div className="relative h-[calc(100svh-21rem)] min-h-[55svh] w-full overflow-hidden rounded-lg border border-muted-foreground/30 bg-background shadow-lg">
          {previewEmbedLoaded ? (
            <iframe
              src={openLibraryService.formatReaderUrl(identifier)}
              title={`Preview of ${book.title}`}
              className="absolute inset-0 h-full w-full border-0"
              allow="fullscreen"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <BookOpen className="size-8 text-muted-foreground" />
              <p className="max-w-sm text-sm text-muted-foreground">
                Click in the button below to load the interactive book preview.
              </p>
              <Button onClick={() => setPreviewEmbedLoaded(true)}>
                Load interactive preview
              </Button>
            </div>
          )}
        </div>
        {renderReturnDialog()}
      </div>
    </article>
  );

  if (!source) {
    if (isPreviewError) {
      return (
        <article className="flex min-h-[calc(100svh-4.3rem)] items-center justify-center bg-muted p-5">
          <Card className="flex flex-col items-center justify-center border border-destructive/30 bg-destructive/10 p-8 text-center text-destructive">
            <p className="text-sm font-medium">
              {previewError?.message ||
                "An error occurred while loading the preview."}
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <Button
                render={<Link to={`/books/${book.id}`} />}
                variant="outline"
                className="text-foreground"
              >
                Back to book
              </Button>
              <Button
                variant="destructive"
                size="lg"
                onClick={() => refetchPreview()}
              >
                Try again
              </Button>
            </div>
          </Card>
        </article>
      );
    }

    if (previewIdentifier) {
      return renderPreview(previewIdentifier);
    }

    return (
      <article className="flex min-h-[calc(100svh-4.3rem)] items-center justify-center bg-muted p-5">
        <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <BookOpen className="size-10 text-muted-foreground" />
          <p className="text-base">
            This book has no readable digital copy available right now. <br />
            You can still borrow it and read the catalog details.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              render={<Link to={`/books/${book.id}`} />}
              variant="outline"
            >
              Back to book
            </Button>
            <Button
              render={
                <a
                  href={`https://openlibrary.org/works/${book.id}`}
                  target="_blank"
                  rel="noreferrer"
                />
              }
              variant="outline"
            >
              <Library className="size-4" />
              View on Open Library
            </Button>
            <Button
              render={
                <a
                  href={`https://archive.org/search?query=${encodeURIComponent(
                    `${book.title} ${book.author}`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                />
              }
              variant="outline"
            >
              <ExternalLink className="size-4" />
              Search on archive.org
            </Button>
          </div>
        </Card>
      </article>
    );
  }

  if (isPagesLoading) return <ReadingSkeleton />;

  if (isPagesError || !readingPages) {
    return renderPreview(source.iaIdentifier);
  }

  return (
    <article className="flex min-h-[calc(100svh-4.3rem)] flex-col gap-3 bg-muted p-3 md:p-5">
      {renderHeader()}
      <BookReader key={source.iaIdentifier} readingPages={readingPages} />
      {renderReturnDialog()}
    </article>
  );
}
