interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

interface QueuedTask<T> {
  fn: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

export interface RateLimiterOptions {
  maxRequests?: number;
  windowMs?: number;
  defaultTtlMs?: number;
}

export class RateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly minIntervalMs: number;
  private readonly defaultTtlMs: number;

  private queue: QueuedTask<unknown>[] = [];
  private requestTimestamps: number[] = [];
  private isProcessing = false;
  private lastRequestTime = 0;

  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly inFlightRequests = new Map<string, Promise<unknown>>();

  constructor(options: RateLimiterOptions = {}) {
    this.maxRequests = options.maxRequests ?? 3;
    this.windowMs = options.windowMs ?? 1000;
    this.defaultTtlMs = options.defaultTtlMs ?? 10 * 60 * 1000; // 10 minutes
    this.minIntervalMs = Math.ceil(this.windowMs / this.maxRequests);
  }

  public getCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  public setCache<T>(key: string, data: T, ttlMs = this.defaultTtlMs): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  public clearCache(): void {
    this.cache.clear();
    this.inFlightRequests.clear();
  }

  public getCacheSize(): number {
    return this.cache.size;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public reset(): void {
    this.clearCache();
    this.queue = [];
    this.requestTimestamps = [];
    this.isProcessing = false;
    this.lastRequestTime = 0;
  }

  public async schedule<T>(
    fn: () => Promise<T>,
    cacheKey?: string,
    ttlMs?: number
  ): Promise<T> {
    if (cacheKey) {
      const cached = this.getCache<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const inFlight = this.inFlightRequests.get(cacheKey) as Promise<T> | undefined;
      if (inFlight !== undefined) {
        return inFlight;
      }
    }

    const taskPromise = new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      void this.processQueue();
    });

    if (cacheKey) {
      this.inFlightRequests.set(cacheKey, taskPromise as Promise<unknown>);
      taskPromise
        .then((result) => {
          this.setCache(cacheKey, result, ttlMs);
        })
        .catch(() => {
        })
        .finally(() => {
          this.inFlightRequests.delete(cacheKey);
        });
    }

    return taskPromise;
  }

  private async calculateDelay(): Promise<number> {
    const now = Date.now();

    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    if (this.requestTimestamps.length >= this.maxRequests) {
      const oldest = this.requestTimestamps[0];
      const waitTime = oldest + this.windowMs - now + 10;
      if (waitTime > 0) {
        return waitTime;
      }
    }

    const timeSinceLast = now - this.lastRequestTime;
    if (timeSinceLast < this.minIntervalMs) {
      return this.minIntervalMs - timeSinceLast;
    }

    return 0;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const waitTime = await this.calculateDelay();
      if (waitTime > 0) {
        await this.delay(waitTime);
        continue;
      }

      const currentTask = this.queue.shift();
      if (!currentTask) break;

      const executionTime = Date.now();
      this.requestTimestamps.push(executionTime);
      this.lastRequestTime = executionTime;

      try {
        const result = await currentTask.fn();
        currentTask.resolve(result);
      } catch (error) {
        currentTask.reject(error);
      }
    }

    this.isProcessing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
