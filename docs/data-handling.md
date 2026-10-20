# Efficient Data Handling for Large Datasets

This document describes how J's Library handles potentially large result sets efficiently, from the external Open Library catalog (millions of works) down to the Supabase-backed user data.

## Architecture overview

Data flows through three layers:

```
Page → React Query hook → Service class → External API (Open Library / Supabase)
```

Remote state lives entirely in **TanStack React Query** (`src/main.tsx`). There is no client-side copy of unbounded datasets: every list the UI renders is either paginated server-side or capped by the service layer.

## Strategies in place

### 1. Server-side pagination

Search never fetches "everything". `src/services/openLibrary/search.ts` translates the current page into an `offset`/`limit` request, so only one page (20 items by default) crosses the network:

- `offset = (page - 1) * limit` — only the current page is requested (`search.ts`, `getSearchResults`)
- The service returns `total`, `totalPages`, and `hasMore` so the UI can render "Page X of Y" controls without knowing the full dataset (`src/pages/SearchPage.tsx`)
- The hook exposes `nextPage`/`prevPage` with clamping (`src/hooks/useBookSearch.ts`)

### 2. Query result caps

Every list endpoint applies a hard limit at the source:

- Notifications: `.limit(25)` in `src/services/notificationService.ts`
- Home catalog: fixed `limitPerCategory` (10 per genre) via `useHomeCatalog`
- Reader pages: loaded one book's worth of pages at a time (`useReadingPages`)

### 3. Server-state caching (React Query)

`staleTime` tuning avoids refetching large payloads the user just saw:

| Query | staleTime |
|---|---|
| Book search | 5 min (`useBookSearch.ts`) |
| Book details | 10 min (`useBookDetails.ts`) |
| Home catalog | 15 min (`useHomeCatalog.ts`) |
| Reading pages / archive preview | 30 min |

`placeholderData: keepPreviousData` in `useBookSearch` keeps the previous page on screen while the next page loads, eliminating flicker between pages.

### 4. Custom rate limiter with TTL cache and request dedupe

`src/services/rateLimiter.ts` sits in front of every Open Library request (`src/services/openLibrary/client.ts`):

- **Token-bucket throttle**: max 3 requests/second, excess requests are queued and released on schedule
- **TTL in-memory cache** (10 min default): repeated identical requests (e.g. the same book page visited twice) are served from memory with zero network cost
- **In-flight deduplication**: concurrent identical requests share a single network promise — scrolling a grid that references the same cover triggers one fetch, not twenty

### 5. Debounced filtering and memoized facet computation

- The search input is debounced at 400 ms (`useBookSearch.ts`) so keystrokes do not generate a request per character
- Genre/author facet lists are computed inside `useMemo` from the current result page only, and capped (`.slice(0, 15)`), so they stay cheap even when the catalog is huge

### 6. Render-time cost control

- `BookCard` is wrapped in `React.memo` (`src/components/layout/BookCard/BookCard.tsx`), so scrolling/re-rendering a grid of 20+ cards does not re-render every card
- `useMemo`/`useCallback` protect derived values and handlers in `useBookSearch`, `ThemeProvider`, and the UI kit

## Not yet implemented (recommended)

- **Virtualization** (e.g. `@tanstack/react-virtual`): page sizes are currently small (10–20 items) so it is not needed, but it would be the next step if page sizes grow
- **Infinite scroll** via `useInfiniteQuery`: the README lists it as a planned feature; the service layer already exposes `hasMore`, so the migration is straightforward
- **Web workers**: facet/filter computation is light enough to stay on the main thread today
