# Client-Side Form Validation

This document describes the client-side validation added to every form so submissions are secure and error-free, and how it complements the existing server-side checks.

## Design

- Validators live in **`src/utils/validation.ts`** as pure functions returning a user-facing message or `null` (unit-tested in `src/utils/__tests__/validation.test.ts`)
- Inputs are first **sanitized** with `src/utils/sanitize.ts` (control-character stripping, whitespace collapse, length caps) before being submitted — see `docs/input-validation-and-xss.md`
- Forms use `noValidate` and a single validation pass in `onSubmit`; errors are cleared per-field as the user types
- Error messages are announced to assistive tech: rendered with `role="alert"` (via `FieldError` from `src/components/ui/field.tsx`, or explicit attributes in dialogs) and inputs get `aria-invalid` + `aria-describedby` pointing at the message
- Server-side validation remains the source of truth (Supabase auth policies, `wishlistService.validateName`, `loanService.parseDueDate`); client validation is a fast, UX-first layer that never replaces it

## Form-by-form

### Login (`src/components/auth/login-form.tsx`)

| Field | Rules |
|---|---|
| Email | required, trimmed, format-checked (`validateEmail`), max 254 chars |
| Password | required |

Server auth errors are shown in a `role="alert"` element.

### Signup (`src/components/auth/signup-form.tsx`)

| Field | Rules |
|---|---|
| Full name | required, max 100 chars (`validateFullName`) |
| Email | required, format-checked, max 254 chars |
| Password | required, `minLength={8}` + `validatePassword` |
| Confirm password | required, must match password (`validatePasswordConfirmation`) |

Previously a password mismatch only printed to the console and silently returned — it now renders a visible, announced error and the min-length rule is enforced (it was helper text only). `autoComplete` attributes (`name`, `email`, `new-password`) assist password managers.

### Wishlist create/rename (`src/components/wishlist/WishlistFormDialog.tsx`)

- Required, max 100 chars (`validateWishlistName`), name sanitized via `sanitizeText` before submit
- Hint text ("Up to 100 characters") plus inline `role="alert"` error

### Add to wishlist (`src/components/wishlist/AddToWishlistDialog.tsx`)

- When "Create new wish list…" is selected, the new name goes through the same `validateWishlistName` + `sanitizeText` path with an inline error

### Borrow book (`src/components/loan/BorrowBookDialog.tsx`)

- Due date: `type="date"`, `min={today}`, plus `validateDueDate` (valid date, not in the past) with an inline error
- Duplicates/availability are still enforced server-side (`loanService.ts`)

### Search (`HomePage.tsx`, `SearchPage.tsx` via `SearchBar`)

- Submissions run through `sanitizeSearchQuery` (trim, collapse whitespace, 200-char cap); empty queries are rejected
- The input has `aria-label="Search books"` and `maxLength={200}`

## Error UX contract

1. Submit → validate all fields → render all failing messages at once (not one-per-keystroke)
2. Any change to a field clears that field's error immediately
3. Errors are always user-facing sentences ("Passwords do not match."), never raw exception text
4. Submit buttons disable and swap their label while a request is pending, preventing double submissions

## Test coverage

- `src/utils/__tests__/validation.test.ts` — every validator, including edge cases (whitespace-only names, past dates, malformed dates, over-length input)
- Existing form/page test suites still pass (161 tests total)
