# Notification Detection

This document describes how the system identifies new notifications.

## Mechanism: polling via React Query

New notifications are detected by **periodic polling** — there is no WebSocket or Server-Sent Events channel. The entire detection logic lives in one hook:

`src/hooks/useNotifications.ts`

```ts
const NOTIFICATIONS_POLL_INTERVAL_MS = 30_000;

useQuery({
  queryKey: ["notifications", userId],
  queryFn: () => notificationService.getMyNotifications(userId),
  enabled: Boolean(userId),
  refetchInterval: userId ? NOTIFICATIONS_POLL_INTERVAL_MS : false,
  refetchIntervalInBackground: false,
});
```

Key properties:

- **Every 30 seconds** the hook refetches the current user's notifications from Supabase
- Polling only starts for authenticated users (`enabled: Boolean(userId)`) and stops when `userId` is absent
- `refetchIntervalInBackground: false` **pauses polling while the browser tab is hidden**, resuming when the user returns — no requests are wasted on background tabs
- Both consumers of notifications — the desktop `NotificationBell` and the mobile `ProfileMenu` — share the same query key `["notifications", userId]`, so React Query **deduplicates them into a single poll**, regardless of how many components are mounted

## Data source

`src/services/notificationService.ts` loads the newest 25 rows from the Supabase `notifications` table, ordered by `created_at` descending, joined with the related book (`books:related_book_id(work_id)`).

Notifications are **created server-side** by Supabase database triggers/rules when domain events happen (a loan becomes due/overdue, a borrow is confirmed, etc.). The client never creates notifications itself; it only reads and updates them. See `database-schema.md` for the table definition.

## How "new" (unread) is surfaced

- **Unread badge count** is derived client-side: `(notifications ?? []).filter(n => !n.is_read).length`
  - Desktop bell: `src/components/notifications/NotificationBell.tsx` (badge capped at "9+")
  - Mobile: `src/components/layout/ProfileMenu.tsx` (badge on the avatar button and on the "Notifications" menu item)
- **Per-row unread dot** in `src/components/notifications/NotificationsList.tsx` (destructive-colored dot when `is_read` is false)
- **Screen readers** get the count via sr-only text: "Notifications (3 unread)"

## Lifecycle of a notification

1. Row is inserted into `notifications` by Supabase (server-side)
2. Next poll (≤ 30 s) returns it; React Query updates the cache, which re-renders bell/dialog/list reactively
3. User actions — mark read, mark all read, remove, clear all (`notificationService.ts`) — run as mutations in `src/hooks/useNotificationActions.ts`, which invalidate the `["notifications"]` query in `onSettled`, so the badge and list refresh immediately after any change
4. Opening a notification marks it read and navigates to the related book or `/loans` (`NotificationsDialog.tsx`)

## Trade-offs and future work

| Approach | Latency | Cost | Status |
|---|---|---|---|
| Polling (30 s) | up to 30 s | one lightweight query per interval | **implemented** |
| Supabase Realtime (WebSocket) | near-instant | persistent connection | possible future upgrade |
| Push notifications | instant | infrastructure-heavy | not planned |

Supabase Realtime would be the natural upgrade: the `notifications` table could be subscribed with `supabase.channel(...).on("postgres_changes", ...)`, replacing `refetchInterval` while keeping the same React Query cache shape.
