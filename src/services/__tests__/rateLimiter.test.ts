import { jest } from "@jest/globals";
import { RateLimiter } from "../rateLimiter";

describe("RateLimiter", () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    jest.useFakeTimers();
    rateLimiter = new RateLimiter({
      maxRequests: 3,
      windowMs: 1000,
      defaultTtlMs: 60 * 1000,
    });
  });

  afterEach(() => {
    rateLimiter.reset();
    jest.useRealTimers();
  });

  it("should execute a single task immediately", async () => {
    const fn = jest.fn(async () => "data");
    const promise = rateLimiter.schedule(() => fn());

    await jest.advanceTimersByTimeAsync(10);
    const result = await promise;

    expect(result).toBe("data");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should not execute more than 3 requests per second", async () => {
    const fn = jest.fn(async (val: number) => val);

    const p1 = rateLimiter.schedule(() => fn(1));
    const p2 = rateLimiter.schedule(() => fn(2));
    const p3 = rateLimiter.schedule(() => fn(3));
    const p4 = rateLimiter.schedule(() => fn(4));

    await jest.advanceTimersByTimeAsync(5);
    expect(fn).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(340);
    expect(fn).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(340);
    expect(fn).toHaveBeenCalledTimes(3);

    expect(fn).not.toHaveBeenCalledWith(4);

    await jest.advanceTimersByTimeAsync(350);
    expect(fn).toHaveBeenCalledTimes(4);

    const results = await Promise.all([p1, p2, p3, p4]);
    expect(results).toEqual([1, 2, 3, 4]);
  });

  it("should deduplicate in-flight requests with identical cacheKey", async () => {
    const fn1 = jest.fn(
      () =>
        new Promise<string>((res) => {
          setTimeout(() => res("result"), 500);
        })
    );

    const p1 = rateLimiter.schedule(() => fn1(), "shared-key");
    const p2 = rateLimiter.schedule(() => fn1(), "shared-key");

    await jest.advanceTimersByTimeAsync(600);

    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1).toBe("result");
    expect(r2).toBe("result");
    expect(fn1).toHaveBeenCalledTimes(1);
  });

  it("should return cached data on subsequent requests with identical cacheKey", async () => {
    const fn = jest.fn(async () => "cached-value");

    const res1 = await rateLimiter.schedule(() => fn(), "key-cache");
    expect(res1).toBe("cached-value");
    expect(fn).toHaveBeenCalledTimes(1);

    const res2 = await rateLimiter.schedule(() => fn(), "key-cache");
    expect(res2).toBe("cached-value");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should expire cache after TTL", async () => {
    const fn = jest.fn(async () => "val");

    await rateLimiter.schedule(() => fn(), "ttl-key", 500);
    expect(fn).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(600);

    const promise2 = rateLimiter.schedule(() => fn(), "ttl-key", 500);
    await jest.advanceTimersByTimeAsync(50);
    await promise2;

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
