import type { OpenLibraryServiceConfig } from "@/type/openLibrary";
import { RateLimiter } from "../rateLimiter";

export interface OpenLibraryClient {
  readonly baseUrl: string;
  readonly rateLimiter: RateLimiter;
  readonly fetcher: typeof fetch;
}

export function createOpenLibraryClient(
  config: OpenLibraryServiceConfig = {},
): OpenLibraryClient {
  return {
    baseUrl: config.baseUrl ?? "https://openlibrary.org",
    rateLimiter:
      config.rateLimiter ??
      new RateLimiter({
        maxRequests: 3,
        windowMs: 1000,
        defaultTtlMs: 10 * 60 * 1000,
      }),
    fetcher: config.fetcher ?? ((...args) => fetch(...args)),
  };
}

export async function requestJson<T>(
  client: OpenLibraryClient,
  url: string,
  cacheKey: string,
  formatError: (res: Response) => string,
  accept = "application/json",
): Promise<T> {
  return client.rateLimiter.schedule(async () => {
    const res = await client.fetcher(url, { headers: { Accept: accept } });

    if (!res.ok) {
      throw new Error(formatError(res));
    }

    return (await res.json()) as T;
  }, cacheKey);
}

export function normalizeWorkId(workId: string): string {
  const trimmed = decodeURIComponent(workId).trim();
  return trimmed.replace(/^\/?works\//, "");
}
