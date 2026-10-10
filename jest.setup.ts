import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Polyfill global jest object in ESM VM environments
if ((globalThis as unknown as { jest?: unknown }).jest === undefined) {
  (globalThis as unknown as { jest: unknown }).jest = jest;
}
