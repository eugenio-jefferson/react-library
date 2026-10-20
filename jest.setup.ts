import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { TextDecoder, TextEncoder } from 'node:util';

// Polyfill global jest object in ESM VM environments
if ((globalThis as unknown as { jest?: unknown }).jest === undefined) {
  (globalThis as unknown as { jest: unknown }).jest = jest;
}

// Polyfills required by react-router in the jsdom environment
if (globalThis.TextEncoder === undefined) {
  (globalThis as unknown as { TextEncoder: typeof TextEncoder }).TextEncoder =
    TextEncoder;
}
if (globalThis.TextDecoder === undefined) {
  (globalThis as unknown as { TextDecoder: typeof TextDecoder }).TextDecoder =
    TextDecoder;
}

// Polyfill ResizeObserver for embla-carousel in the jsdom environment
if (
  (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver ===
  undefined
) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
    ResizeObserverStub;
}

// Polyfill IntersectionObserver for embla-carousel in the jsdom environment
if (
  (globalThis as unknown as { IntersectionObserver?: unknown })
    .IntersectionObserver === undefined
) {
  class IntersectionObserverStub {
    root = null;
    rootMargin = "";
    thresholds = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  (globalThis as unknown as { IntersectionObserver: unknown })
    .IntersectionObserver = IntersectionObserverStub;
}

// Polyfill matchMedia for embla-carousel and useIsMobile in the jsdom environment
if (
  typeof window !== "undefined" &&
  window.matchMedia === undefined
) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
