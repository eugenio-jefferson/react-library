import { cn } from "cn";

export type LoanBadgeState =
  | "available"
  | "borrowed"
  | "overdue"
  | "unavailable"
  | "returned";

const badgeConfig: Record<
  LoanBadgeState,
  { label: string; className: string }
> = {
  available: {
    label: "Available to borrow",
    className: "border-primary/40 bg-primary/10 text-primary",
  },
  borrowed: {
    label: "Borrowed",
    className: "border-accent/40 bg-accent/10 text-accent",
  },
  overdue: {
    label: "Overdue",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  unavailable: {
    label: "No copies available",
    className: "border-muted-foreground/40 bg-muted text-muted-foreground",
  },
  returned: {
    label: "Returned",
    className: "border-muted-foreground/40 bg-muted text-muted-foreground",
  },
};

function LoanBadge({
  state,
  className,
}: {
  readonly state: LoanBadgeState;
  readonly className?: string;
}) {
  const { label, className: badgeClassName } = badgeConfig[state];

  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium",
        badgeClassName,
        className,
      )}
    >
      {label}
    </span>
  );
}

export default LoanBadge;
