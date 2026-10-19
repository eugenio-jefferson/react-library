export function toLocalDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function defaultDueDate(): string {
  const due = new Date();
  due.setDate(due.getDate() + 14);
  return toLocalDateInput(due);
}

export function formatLoanDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}
