# J's Library

A book discovery and lending web application: browse a home catalog of trending books and curated genres, search the Open Library catalogue with filters and pagination, inspect full book details, borrow books with a return deadline, read available editions in-app, organize wish lists, and follow notifications.

## Table of Contents

- [Description](#description)
- [Technologies](#technologies)
- [Architecture](#architecture)
- [Documentation](#documentation)
- [Features to implement](#features-to-implement)
- [Challenges faced](#challenges-faced)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment variables](#environment-variables)
  - [Running the project](#running-the-project)
  - [Available scripts](#available-scripts)

## Description

J's Library is a single-page application that lets readers discover, borrow and read books without owning a catalogue of their own:

- **Home**: hero search box, a _Trending Books_ row (Open Library daily trending) and genre rows (Fiction, Fantasy, Science Fiction, Mystery, Romance).
- **Search**: query Open Library with debounced input, sorting (relevance, popularity, rating, newest, oldest, title), genre filter, result count and previous/next pagination.
- **Book detail**: cover, title, author, publish date, description and subject tags for a single work, with borrow and add-to-wish-list actions.
- **Loans**: borrow a book with a chosen return deadline, track active and past loans, return a book, and get overdue feedback.
- **Reading**: in-app page-by-page reader for readable editions (archive.org IIIF pages with keyboard navigation), with an on-demand archive.org preview fallback for books without a readable edition.
- **Wish lists**: create, rename and delete wish lists; add or remove books from any list.
- **Notifications**: a header bell (desktop) and profile-menu badge (mobile) surface unread notifications (loan due dates, borrow confirmations…), polled every 30 s, with mark-read/remove/clear actions.
- **Auth**: registration, login and logout backed by Supabase, with a profile dropdown in the header showing the session email.
- **UI**: dark/light/system theme switcher, responsive catalog grid, skeleton loaders, explicit error states with retry, skip-to-content link and route-level code splitting.

All catalogue data comes from the free [Open Library](https://openlibrary.org/developers/api) API (plus archive.org for readable editions); authentication, loans, wish lists and notifications are backed by [Supabase](https://supabase.com/).

## Technologies

| Technology                                 | Why it was chosen                                                                                                                                                       |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **React 19 + TypeScript**                  | Component model fits a catalog/search UI; TS types (`Book`, `BookDetails`, `BookSearchParams`) keep the Open Library payloads safe across service, hooks and UI layers. |
| **Vite**                                   | Instant HMR and a tiny config for dev and production builds (`tsc -b && vite build`), with `React.lazy` route chunks out of the box.                                    |
| **React Router v8**                        | Declarative routes for `/`, `/search`, `/books/:id`, `/books/:id/read`, `/loans`, `/wishlists`, `/login`, `/register` under a shared layout.                            |
| **TanStack React Query**                   | Remote state (cache, stale times, `keepPreviousData` pagination, mutations for auth/loans/wishlists/notifications) so components stay free of fetch plumbing.           |
| **Supabase JS + `@supabase/ssr`**          | Managed auth plus Postgres-backed loans, wish lists and notifications without running our own backend.                                                                  |
| **Tailwind CSS v4 + shadcn/Base UI + CVA** | Utility-first styling with a reusable `src/components/ui` kit (button, card, skeleton, dropdown, dialog…) and variant-driven class composition.                         |
| **Custom `RateLimiter`**                   | Open Library rate-limits aggressively, so requests are queued, throttled and cached client-side (see challenges).                                                       |
| **Jest + Testing Library (jsdom)**         | Unit tests for services, hooks and components with ESM/ts-jest configuration.                                                                                           |
| **ESLint (typescript-eslint)**             | Linting for React hooks and refresh rules.                                                                                                                              |

## Architecture

Layered, feature-oriented structure: **pages → components/hooks → services → external APIs**.

```
src/
├── main.tsx                 # App bootstrap: BrowserRouter → ThemeProvider → QueryClientProvider
├── App.tsx                  # Route table under the AppLayout shell (lazy-loaded routes)
├── pages/                   # Route-level views
│   ├── HomePage.tsx         # hero + trending/category catalogs
│   ├── SearchPage.tsx       # query, filters, pagination (URL-synced via ?q=)
│   ├── BookPage.tsx         # /books/:id detail + borrow/wishlist actions
│   ├── ReadingPage.tsx      # /books/:id/read in-app reader + preview fallback
│   ├── MyLoansPage.tsx      # /loans active and past loans
│   ├── WishlistsPage.tsx    # /wishlists management
│   └── Login.tsx / Register.tsx
├── components/
│   ├── layout/              # AppLayout, Header, Footer, Catalog, BookCard, SearchBar,
│   │                        # SearchControlsBar, ThemeSwitcher, ProfileMenu
│   ├── auth/                # login-form, signup-form, RequireAuth
│   ├── loan/                # BorrowBookDialog, ReturnBookDialog, LoanBadge
│   ├── notifications/       # NotificationBell, NotificationsDialog, NotificationsList
│   ├── wishlist/            # AddToWishlistDialog, WishlistFormDialog, DeleteWishlistDialog
│   ├── ui/                  # shadcn-style primitives (button, card, dialog, skeleton…)
│   └── ThemeProvider.tsx    # dark/light/system theme context
├── hooks/                   # useHomeCatalog, useBookSearch, useBookDetails, useMyLoans,
│                            # useWishlists, useNotifications, useReadingSource/Pages,
│                            # useUserAccount, useAuthSession, useTheme, use-mobile
├── services/                # side-effectful boundary to the outside world
│   ├── openLibraryService.ts# facade over openLibrary/ (search, catalog, details, reading)
│   ├── openLibrary/         # client, search, catalog, bookDetails, reading, mappers
│   ├── rateLimiter.ts       # queue + throttle + TTL cache + in-flight dedupe
│   ├── loanService.ts       # Supabase loans (borrow, return, due dates)
│   ├── wishlistService.ts   # Supabase wish lists + items (with name validation)
│   ├── notificationService.ts # Supabase notifications (list, mark read, clear)
│   ├── userAccountService.ts# Supabase signUp/signIn/getSession/signOut
│   └── supabaseClient.ts    # client created from VITE_* env vars
├── utils/
│   ├── sanitize.ts          # control-char stripping, search-query cleanup, safe URL checks
│   └── validation.ts        # email/password/name/date validators used by the forms
├── type/                    # book.ts, loan.ts, notification.ts, reading.ts, wishlist.ts, …
└── index.css                # Tailwind theme tokens
```

Data flow for a typical read:

1. A page renders a hook (`useBookSearch`), which builds a `queryKey` and calls `openLibraryService`.

2. The service throttles the call through `RateLimiter` (queue, cache, in-flight dedupe) and fetches `https://openlibrary.org`.

3. The raw response is mapped into domain models (`Book`, `BookDetails`); React Query caches it (`staleTime` 5–30 min).

4. The hook returns ready-made state (loading/error/data + pagination controls) that the page passes to `Catalog` / `BookCard`.

Writes follow the same shape through React Query mutations: `useUserAccount` (auth), `useLoanActions`, `useWishlistActions` and `useNotificationActions` invalidate their queries on success so the UI stays in sync. `ProfileMenu`/`useAuthSession` subscribe to `onAuthStateChange` to react to session changes.

Tests live next to their target in `__tests__/` folders and run with `npm test`.

## Documentation

Deep-dive documents live in [`docs/`](./docs/README.md):

| Document                                                               | Contents                                                                                     |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [docs/data-handling.md](./docs/data-handling.md)                       | Efficient handling of large datasets: server-side pagination, caching, rate limiting, dedupe |
| [docs/notifications.md](./docs/notifications.md)                       | How new notifications are identified (polling, badge derivation, lifecycle)                  |
| [docs/accessibility.md](./docs/accessibility.md)                       | Keyboard navigation & ARIA audit: implemented vs missing                                     |
| [docs/lazy-loading.md](./docs/lazy-loading.md)                         | Image lazy loading, route code splitting, deferred iframe, preconnect                        |
| [docs/input-validation-and-xss.md](./docs/input-validation-and-xss.md) | XSS defenses and the sanitization/validation layer                                           |
| [docs/performance.md](./docs/performance.md)                           | Optimizations implemented and measured bundle sizes                                          |
| [docs/form-validation.md](./docs/form-validation.md)                   | Client-side form validation rules and error UX                                               |

## Features to implement

- Reviews and star ratings written by users.
- Infinite scroll or numbered page jumps instead of prev/next only.
- Author pages (bibliography, bio) and publisher browse.
- Book sharing (deep links, Open Graph previews) and a "surprise me" random book.
- Offline support / service worker and a persistent client-side cache (e.g. localStorage).
- E2E tests (Playwright/Cypress) and CI pipeline with lint + test + build.
- Remaining accessibility polish: per-route document titles, focus management on navigation, `aria-live` announcements (see [docs/accessibility.md](./docs/accessibility.md)).
- Supabase Realtime channel to replace notification polling (see [docs/notifications.md](./docs/notifications.md)).

## Challenges faced

- **Open Library rate limiting and flaky responses**: solved with a custom `RateLimiter` (`src/services/rateLimiter.ts`) that queues requests (max 3/s), deduplicates in-flight calls by cache key and stores results with a TTL, plus an in-memory cache for the whole home catalog. Endpoints also degrade gracefully (subject → search fallback, trending → "bestseller" search).
- **Mixed/incomplete API payloads**: Open Library returns descriptions as string _or_ object, authors only as keys, and docs without covers. Handled with normalizers (`parseDescription`, `resolveWorkAuthor`, `formatCoverUrl`) that fall back to "Unknown Author", a generated SVG placeholder cover and stable IDs.
- **Pagination + filters state sync**: search state lives in the URL (`?q=`) so results are shareable, while debounce (400 ms), page resets and React Query's `keepPreviousData` keep navigation smooth without flicker.
- **Reading availability varies per book**: some works have archive.org IIIF pages, others only a preview embed, others nothing. The reader resolves this in order (readable pages → on-demand preview embed → external links) via `getReadingSource`/`searchArchiveIdentifier`.
- **Keeping the initial bundle small**: route-level `React.lazy` splitting, an on-demand archive.org iframe and `preconnect` hints cut the initial JS from ~801 kB to ~355 kB (112.7 kB gzip) — see [docs/performance.md](./docs/performance.md).
- **ESM-only toolchain**: React Router v8, ts-jest and `import.meta.env` required an ESM setup (`NODE_OPTIONS=--experimental-vm-modules`, ts-jest ESM preset, `type: module`) and a custom `moduleNameMapper` for the `@/` alias and CSS modules.
- **Layout/deployment paths**: `VITE_BASE_PATH` / `VITE_BASE_URL` allow the build to be deployed under a sub-path without hard-coded URLs.
- **Session reactivity**: keeping the header in sync with Supabase without global state by subscribing to `onAuthStateChange` inside `ProfileMenu`.

## Getting started

### Prerequisites

- **Node.js** 20.19+ (or 22.12+)
- **npm** 10+
- A **Supabase** project (free tier is enough) for authentication, loans, wish lists and notifications

### Installation

```bash
git clone <repository-url> <folder-name>
cd <folder-name>
npm install
```

### Environment variables

Copy the example file and fill in the values from your Supabase project (**Project Settings → API**):

```bash
cp .env.local.example .env.local
```

```bash
# .env.local
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

| Variable                        | Description                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | Supabase project URL (`https://<ref>.supabase.co`).                                                |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable/anon API key used by the browser client.                                               |
| `VITE_BASE_PATH`                | Optional. Base path for the built app (default `/`), useful when deploying to a sub-directory.     |
| `VITE_BASE_URL`                 | Optional. Absolute base URL used for the email confirmation redirect when `window` is unavailable. |

In Supabase, enable **Email** authentication and add your redirect URL (e.g. `http://localhost:5173/login`) under **Authentication → URL Configuration** so confirmation links return to the login page. The database schema (tables, enums and triggers for loans, wish lists and notifications) is defined in [database-schema.md](./docs/database-schema.md).

No API key is needed for Open Library.

### Running the project

```bash
# development server (HMR) at http://localhost:5173
npm run dev

# production build (type-check + bundle) into dist/
npm run build

# serve the production build locally
npm run preview
```

### Available scripts

| Script            | Description                                   |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Start the Vite dev server.                    |
| `npm run build`   | Type-check with `tsc -b` and build with Vite. |
| `npm run preview` | Preview the production build.                 |
| `npm run lint`    | Run ESLint over the project.                  |
| `npm test`        | Run the Jest test suite.                      |
