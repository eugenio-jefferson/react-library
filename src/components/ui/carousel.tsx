import * as React from "react";
import useEmblaCarousel, {
  type EmblaViewportRefType,
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";

type CarouselApi = UseEmblaCarouselType[1];
type CarouselOptions = NonNullable<Parameters<typeof useEmblaCarousel>[0]>;

interface CarouselContextValue {
  viewportRef: EmblaViewportRefType;
  scrollPrev: () => void;
  scrollNext: () => void;
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarousel(): CarouselContextValue {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error("Carousel components must be used inside a <Carousel>");
  }
  return context;
}

const ARROW_CLASSES =
  "absolute top-1/2 -translate-y-1/2 size-8 rounded-full shadow-md hidden md:inline-flex dark:bg-card dark:border-input/70 dark:text-foreground dark:shadow-black/60 dark:hover:bg-muted/70";

interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  opts?: CarouselOptions;
  setApi?: (api: CarouselApi) => void;
  orientation?: "horizontal" | "vertical";
}

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  className,
  children,
  ...props
}: CarouselProps) {
  const [viewportRef, emblaApi] = useEmblaCarousel({
    ...opts,
    axis: orientation === "horizontal" ? "x" : "y",
  });

  const scrollPrev = React.useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext],
  );

  React.useEffect(() => {
    if (emblaApi) setApi?.(emblaApi);
  }, [emblaApi, setApi]);

  const contextValue = React.useMemo(
    () => ({ viewportRef, scrollPrev, scrollNext }),
    [viewportRef, scrollPrev, scrollNext],
  );

  return (
    <CarouselContext.Provider value={contextValue}>
      <div
        role="region"
        aria-roledescription="carousel"
        className={cn("relative", className)}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { viewportRef } = useCarousel();

  return (
    <div ref={viewportRef} className="overflow-hidden">
      <div className={cn("flex", className)} {...props}>
        {children}
      </div>
    </div>
  );
}

function CarouselItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      className={cn("min-w-0 shrink-0 grow-0", className)}
      {...props}
    />
  );
}

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { scrollPrev } = useCarousel();

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(ARROW_CLASSES, "-left-2 md:-left-6", className)}
      aria-label="Previous slide"
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="size-4" />
    </Button>
  );
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { scrollNext } = useCarousel();

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(ARROW_CLASSES, "-right-2 md:-right-6", className)}
      aria-label="Next slide"
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="size-4" />
    </Button>
  );
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
