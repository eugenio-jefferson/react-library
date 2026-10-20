# Performance Optimization

This document describes the performance characteristics of J's Library and the optimizations implemented — both the pre-existing ones and the ones added during this review.

## What was already in place

| Optimization | Where |
|---|---|
| React Query caching (staleTime 5–30 min per resource) | all hooks in `src/hooks/` |
| `keepPreviousData` on paginated search | `useBookSearch.ts` |
| 400 ms input debounce for search typing | `useBookSearch.ts` |
| Custom rate limiter: 3 req/s throttle, 10 min TTL cache, in-flight request dedupe | `src/services/rateLimiter.ts` |
| `retry: 1`, `refetchOnWindowFocus: false` globally | `src/main.tsx` |
| `useMemo`/`useCallback` for derived state and handlers | `useBookSearch`, `ThemeProvider`, UI kit |
| Skeleton loaders (perceived performance) | BookCard, Catalog, BookPage, ReadingPage, NotificationsDialog |
| Image `loading="lazy"` + `decoding="async"` | `BookCard`, `BookPage` |
| Neighbor-page image preloading in the reader | `ReadingPage.tsx` |
| Subsetted variable fonts (woff2, unicode-range) | `@fontsource-variable/roboto` |
| Graceful degradation: subject query falls back to search | `openLibrary/catalog.ts` |

## Implemented in this review

### 1. Route-level code splitting (`src/App.tsx`)

Previously the entire app shipped as one **~801 kB** JavaScript bundle. Now every route except Home is a `React.lazy` chunk loaded on demand behind `<Suspense>` (spinner fallback with `role="status"`):

- Initial bundle: **355.4 kB (112.7 kB gzip)** — a ~56% reduction of first-paint JS
- Login/Register pull the Supabase chunk (220 kB) only when visited
- BookPage (45 kB), ReadingPage (13.5 kB), WishlistsPage, SearchPage, MyLoansPage each load only for their route

### 2. `React.memo` on `BookCard`

Catalog grids render 6–20+ cards. `BookCard` is now memoized, so parent re-renders (search state changes, theme toggles) no longer re-render every card in the grid.

### 3. Deferred archive.org embed (`ReadingPage.tsx`)

The preview `<iframe>` (a full third-party document) is now **click-to-load** behind a "Load interactive preview" button instead of auto-loading on every preview visit.

### 4. Connection warm-up (`index.html`)

`preconnect` hints for `covers.openlibrary.org`, `archive.org`, and `openlibrary.org` overlap DNS/TLS setup with bundle parsing.

### 5. Notification polling hygiene (`useNotifications.ts`)

`refetchIntervalInBackground: false` makes explicit that the 30 s poll pauses while the tab is hidden (and the shared query key already deduplicates the bell + profile menu into one poll).

### 6. Debounce + sanitize on submit

Search submission now runs through `sanitizeSearchQuery` (trim/collapse/length-cap) before hitting the URL or the API, keeping request payloads small and bounded.

## Measured result (production build)

```
index (initial)   355.43 kB │ gzip: 112.70 kB
supabaseClient    220.16 kB │ gzip:  56.85 kB   (auth routes only)
BookPage           45.18 kB │ gzip:  14.63 kB
ReadingPage        13.51 kB │ gzip:   3.64 kB
SearchPage          6.82 kB │ gzip:   2.66 kB
CSS                88.31 kB │ gzip:  15.84 kB
```

## Recommended next steps

1. **Compression at the edge** — ensure the host serves Brotli/Gzip for JS/CSS/woff2 (the gzip numbers above assume it)
2. **HTTP cache headers** — long-lived immutable caching for hashed `/assets/*`, short caching for `index.html`
3. **Manual `manualChunks`** — split React/router into a stable vendor chunk to improve long-term caching across deploys
4. **Service worker** — offline shell + cache-first covers (planned in the README)
5. **Bundle-size budget in CI** — fail the build if the initial chunk grows past a threshold (e.g. `rollup-plugin-visualizer` + size check)
