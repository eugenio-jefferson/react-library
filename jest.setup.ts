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
