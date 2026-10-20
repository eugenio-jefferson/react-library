# Input Validation and Sanitization (XSS Prevention)

This document describes the defenses against cross-site scripting (XSS) and malicious input, and the validation/sanitization layer that was implemented for this review.

## Threat model

User-controlled and external data that reaches the UI:

- Search queries (typed by the user, reflected in the URL `?q=`)
- Wishlist names (stored in Supabase, rendered back in lists)
- Book metadata from Open Library (titles, authors, cover URLs)
- Notification titles/messages from Supabase
- Form fields: email, passwords, full name, loan due dates

## Defense layers

### 1. No HTML injection sinks exist

A full-repo audit found **zero** uses of `innerHTML`, `outerHTML`, `dangerouslySetInnerHTML`, or `insertAdjacentHTML`. All dynamic content is rendered as JSX text children, which React escapes automatically. This is the primary XSS defense.

### 2. Input sanitization utilities (implemented)

New module: `src/utils/sanitize.ts` (unit-tested in `src/utils/__tests__/sanitize.test.ts`)

- **`sanitizeText(input, maxLength)`** — strips C0/C1 control characters, zero-width and bidi-override characters (U+200B–U+200F, U+2028/29, U+FEFF), collapses whitespace, trims, and enforces a length cap. This defeats both script-obfuscation tricks and log/UI spoofing via invisible characters.
- **`sanitizeSearchQuery(input)`** — `sanitizeText` capped at 200 characters; applied to every search submission (`HomePage.tsx`, `SearchPage.tsx`) before it is placed in the URL or sent to the API.
- **`isSafeHttpUrl(url)`** — parses the URL and allows only `http:`/`https:` protocols, rejecting `javascript:`, `data:`, `vbscript:` etc.
- **`isSafeImageSource(url)`** — `isSafeHttpUrl` plus the app's own `data:image/...` placeholder. Enforced at every `<img src>` sink: `BookCard.tsx`, `BookPage.tsx`.

### 3. Output encoding in URLs

All externally constructed URLs encode user-influenced values with `encodeURIComponent` (`src/services/openLibrary/reading.ts`, `bookDetails.ts`, `catalog.ts`, and the search navigation in `HomePage.tsx`/`SearchPage.tsx`).

### 4. External links

Links to external sites use `target="_blank" rel="noreferrer"` (which implies `noopener`), preventing tab-napping via `window.opener`.

### 5. Stored data

Wishlist names and other user-generated strings are sanitized on the client (`sanitizeText` before submit) and validated server-side in the service layer (`wishlistService.validateName`). They are always rendered as React text children, never as HTML.

## What is intentionally NOT done

- **No DOMPurify dependency**: with zero HTML sinks in the codebase, an HTML sanitizer would be dead weight. If `dangerouslySetInnerHTML` is ever introduced, DOMPurify (or equivalent) must be added in the same change.
- **Search queries are not stripped of `<`/`>`**: they are harmless because React escapes them at render and `encodeURIComponent` encodes them in URLs; stripping would corrupt legitimate searches. The invisible/control-character stripping is the meaningful part.

## Validation utilities (implemented)

New module: `src/utils/validation.ts` (unit-tested) — reusable, framework-free validators that return a user-facing message or `null`:

- `validateEmail`, `validatePassword` (min 8 chars), `validatePasswordConfirmation`, `validateFullName`
- `validateWishlistName` (required, ≤ 100 chars)
- `validateDueDate` (valid date, not in the past)

See `docs/form-validation.md` for how these are wired into the forms.

## Regression safety

`src/utils/__tests__/sanitize.test.ts` asserts that `javascript:` and non-image `data:` URLs are rejected, that control/zero-width characters are stripped, and that length caps hold. Any future change to these helpers will fail tests if it reopens an injection path.
