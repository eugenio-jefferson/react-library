import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateFullName,
  validateWishlistName,
  validateDueDate,
  MIN_PASSWORD_LENGTH,
  MAX_WISHLIST_NAME_LENGTH,
} from "../validation";

describe("validateEmail", () => {
  it("accepts a valid email", () => {
    expect(validateEmail("user@example.com")).toBeNull();
  });

  it("trims surrounding whitespace", () => {
    expect(validateEmail("  user@example.com  ")).toBeNull();
  });

  it("rejects empty input", () => {
    expect(validateEmail("")).toBe("Email is required.");
  });

  it("rejects malformed emails", () => {
    expect(validateEmail("not-an-email")).toBe("Enter a valid email address.");
    expect(validateEmail("missing@tld")).toBe("Enter a valid email address.");
    expect(validateEmail("spaces in@example.com")).toBe(
      "Enter a valid email address.",
    );
  });
});

describe("validatePassword", () => {
  it("accepts a password meeting the minimum length", () => {
    expect(validatePassword("a".repeat(MIN_PASSWORD_LENGTH))).toBeNull();
  });

  it("rejects empty input", () => {
    expect(validatePassword("")).toBe("Password is required.");
  });

  it("rejects short passwords", () => {
    expect(validatePassword("short")).toBe(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    );
  });
});

describe("validatePasswordConfirmation", () => {
  it("accepts matching passwords", () => {
    expect(validatePasswordConfirmation("secret123", "secret123")).toBeNull();
  });

  it("rejects mismatched passwords", () => {
    expect(validatePasswordConfirmation("secret123", "secret12")).toBe(
      "Passwords do not match.",
    );
  });

  it("rejects empty confirmation", () => {
    expect(validatePasswordConfirmation("secret123", "")).toBe(
      "Please confirm your password.",
    );
  });
});

describe("validateFullName", () => {
  it("accepts a normal name", () => {
    expect(validateFullName("John Doe")).toBeNull();
  });

  it("rejects empty input", () => {
    expect(validateFullName("   ")).toBe("Full name is required.");
  });
});

describe("validateWishlistName", () => {
  it("accepts a valid name", () => {
    expect(validateWishlistName("Study Materials")).toBeNull();
  });

  it("rejects empty input", () => {
    expect(validateWishlistName("  ")).toBe("Wish list name is required.");
  });

  it("rejects names above the maximum length", () => {
    expect(validateWishlistName("a".repeat(MAX_WISHLIST_NAME_LENGTH + 1))).toBe(
      `Wish list name must be ${MAX_WISHLIST_NAME_LENGTH} characters or fewer.`,
    );
  });
});

describe("validateDueDate", () => {
  const today = new Date(2026, 9, 20);

  it("accepts today", () => {
    expect(validateDueDate("2026-10-20", today)).toBeNull();
  });

  it("accepts a future date", () => {
    expect(validateDueDate("2026-10-27", today)).toBeNull();
  });

  it("rejects past dates", () => {
    expect(validateDueDate("2026-10-19", today)).toBe(
      "The return deadline cannot be in the past.",
    );
  });

  it("rejects empty input", () => {
    expect(validateDueDate("", today)).toBe("Please choose a return deadline.");
  });

  it("rejects malformed dates", () => {
    expect(validateDueDate("not-a-date", today)).toBe("Enter a valid date.");
  });
});
