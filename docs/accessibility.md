# Accessibility: Keyboard Navigation and ARIA

This document audits the current accessibility state of J's Library: what is implemented, what was recently added, and what remains missing.

## Implemented

### Keyboard navigation

- **Interactive primitives are keyboard-operable.** Buttons, links, selects, dialogs, dropdowns, and sheets come from the Base UI/shadcn kit (`src/components/ui/`), which wires native focus behavior, focus trapping in dialogs, and `aria-expanded`/roles on menus.
- **Notification rows** (`src/components/notifications/NotificationsList.tsx`) use `role="button"`, `tabIndex={0}`, and `onKeyDown` handling for Enter/Space, with an explicit `aria-label` that includes the notification title and unread state.
- **Reader keyboard shortcuts** (`src/pages/ReadingPage.tsx`): a window-level `keydown` listener supports ArrowLeft/Right, PageUp/Down, and Home/End for page navigation. It correctly ignores keystrokes originating in inputs/textareas/selects.
- **Focus-visible styling** is present on interactive elements (`ui/button.tsx`, `ui/input.tsx`, `SearchControlsBar`, `BookCard`).

### ARIA roles and labels

- `<nav aria-label="Navigation">` landmark in `src/components/layout/Header/Header.tsx`
- Icon-only buttons carry `aria-label` (notification mark-as-read/remove, reader page navigation, "Back to book")
- Screen-reader-only text (`sr-only`) for icon buttons: bell ("Notifications (N unread)"), profile menu, theme switcher, dialog close buttons
- Form fields are labeled with `FieldLabel htmlFor` in login, signup, wishlist, and borrow dialogs; search inputs carry `aria-label="Search books"`
- Error messages are rendered with `role="alert"` (via the `FieldError` component or explicit attributes) and inputs are wired with `aria-invalid` + `aria-describedby`
- `ui/spinner.tsx` renders `role="status" aria-label="Loading"`; the route-level Suspense fallback also has `role="status"`
- Semantic landmarks are used across pages: `<article>`, `<section>`, `<header>`, `<main>`, `<nav>`

### Recently added (this review)

- **Skip-to-content link** in `src/components/layout/AppLayout.tsx`, targeting `<main id="main-content" tabIndex={-1}>` — the first Tab press on any page reveals "Skip to main content"
- **Accessible badge counts**: notification badges are `aria-hidden` visual indicators accompanied by sr-only text such as "(3 unread)"
- **`aria-invalid` / `aria-describedby` / `role="alert"`** wiring on all validated forms (login, signup, wishlist, add-to-wishlist, borrow)

## Missing / recommended

1. **No `eslint-plugin-jsx-a11y`** — there is no automated accessibility linting. As of today the plugin does not support ESLint 10 (peer dependency capped at `^9`), so it could not be added; revisit when a compatible version ships.
2. **No route-change focus management** — after client-side navigation, focus stays on the triggering element and the new page is not announced. A pattern (focus the `<main>` and/or update `document.title` per route) is recommended.
3. **No `aria-live` regions for async content** — search result counts, loading states, and notification updates are silent to screen readers. `<output>` in `SearchControlsBar` provides an implicit live region as partial mitigation.
4. **Notification rows are clickable `<div role="button">`** rather than real `<button>` elements. A true button was not used because each row contains nested action buttons (invalid HTML inside a `<button>`). Consider restructuring so the row title is the button and actions sit beside it.
5. **Iframe fallback content** — the archive.org preview embed has a `title` but no fallback text inside the iframe element.
6. **Contrast of tiny badge text** (`text-[9px]`/`text-[10px]`) has not been verified with a contrast tool.

## Verification

- `npm run lint` (ESLint flat config) — passes
- Unit tests exercise labels/roles for SearchBar, BookCard, and the reading controls (Jest + Testing Library)
- Recommended manual checks: keyboard-only walkthrough (Tab/Shift+Tab/Enter/Escape), screen-reader pass with VoiceOver or NVDA on login → search → book page → reader
