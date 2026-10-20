export const MIN_PASSWORD_LENGTH = 8;
export const MAX_WISHLIST_NAME_LENGTH = 100;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return "Email is required.";
  if (value.length > 254) return "Email is too long.";
  if (!EMAIL_PATTERN.test(value)) return "Enter a valid email address.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
  }
  return null;
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | null {
  if (!confirmation) return "Please confirm your password.";
  if (password !== confirmation) return "Passwords do not match.";
  return null;
}

export function validateFullName(name: string): string | null {
  if (!name.trim()) return "Full name is required.";
  if (name.trim().length > 100) {
    return "Full name must be 100 characters or fewer.";
  }
  return null;
}

export function validateWishlistName(name: string): string | null {
  const value = name.trim();
  if (!value) return "Wish list name is required.";
  if (value.length > MAX_WISHLIST_NAME_LENGTH) {
    return `Wish list name must be ${MAX_WISHLIST_NAME_LENGTH} characters or fewer.`;
  }
  return null;
}

export function validateDueDate(
  dueDate: string,
  today: Date = new Date(),
): string | null {
  if (!dueDate) return "Please choose a return deadline.";
  const parsed = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Enter a valid date.";
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  if (parsed < startOfToday) {
    return "The return deadline cannot be in the past.";
  }
  return null;
}
