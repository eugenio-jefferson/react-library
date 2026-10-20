# Lazy Loading of Images and Other Resources

This document describes how lazy loading is implemented in J's Library. Where it was missing, it has been implemented as part of this review.

## Images

### Book cover grids and detail page

- `src/components/layout/BookCard/BookCard.tsx` — every cover in a catalog grid renders with `loading="lazy"` and `decoding="async"`. Browsers only fetch covers as they approach the viewport, so the initial page load does not download dozens of unused images. A `Skeleton` placeholder fills the aspect-ratio box until `onLoad` fires, avoiding layout shift.
- `src/pages/BookPage.tsx` — the large detail cover uses the same `loading="lazy"` + `decoding="async"` + skeleton pattern.
- Image URLs are validated with `isSafeImageSource` (`src/utils/sanitize.ts`) before being assigned to `src`, so only `https:`/`http:` URLs or the app's own `data:image/...` placeholder can reach the DOM (XSS-safe sources).

No `IntersectionObserver` code is required: the native `loading="lazy"` attribute is supported by all modern browsers and delegates viewport detection to the browser itself.

### Reader page images (active resource, with preloading)

- The **current** page image in `src/pages/ReadingPage.tsx` is loaded eagerly (no `loading="lazy"`) because it is the primary content the user explicitly navigated to — deferring it would hurt perceived performance.
- **Adjacent pages are preloaded** with `new Image()` whenever `pageIndex` changes, so pressing Next/Previous shows the page instantly from cache. Preloading stops one page beyond the boundaries (no fetch for non-existent neighbors).

## JavaScript: route-level code splitting

Implemented in `src/App.tsx`:

- Every route except the landing page is loaded with `React.lazy(() => import(...))` inside `<Suspense>` with a spinner fallback (`role="status"`)
- HomePage stays eager because it is the entry route — lazy-loading it would add a waterfall to first paint
- Result (production build): the main bundle dropped from a single **~801 kB** file to a **~355 kB** initial chunk, with route chunks fetched on demand:

| Chunk | Size (gzip) |
|---|---|
| `index` (initial) | 112.7 kB |
| `supabaseClient` (auth pages) | 56.9 kB |
| `BookPage` | 14.6 kB |
| `ReadingPage` | 3.6 kB |
| `WishlistsPage` | 2.5 kB |
| `SearchPage` | 2.7 kB |
| `MyLoansPage` | 1.5 kB |
| `Register` | 1.7 kB |
| `Login` | 1.3 kB |

## Heavy third-party embed: deferred iframe

The archive.org interactive preview iframe on the Reading page (`src/pages/ReadingPage.tsx`) previously loaded automatically, pulling a full third-party document into the page. It is now **click-to-load**:

- The preview area renders a lightweight placeholder with a "Load interactive preview" button
- The `<iframe>` is only mounted after the user explicitly asks for it (`previewEmbedLoaded` state)
- This removes an automatic cross-origin document load (and its tracking surface) from every preview visit

## Network warm-up: preconnect

`index.html` now declares `preconnect` hints for the three external origins the app talks to (`covers.openlibrary.org`, `archive.org`, `openlibrary.org`), so DNS/TLS setup happens in parallel with bundle parsing instead of serially on first image/API request.

## Fonts

The app uses `@fontsource-variable/roboto`, which serves subsetted variable `.woff2` files (9 unicode-range subsets) — the browser downloads only the subsets a page actually needs.

## Not implemented

- **Service worker / offline caching** — listed as future work in the README
- **`fetchpriority="high"` on the first visible cover** — optional micro-optimization for the home hero area
