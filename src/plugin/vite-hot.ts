import type { FormDockSnapshot } from './transport';

/**
 * Minimal local typing for the Vite HMR client API we use. Avoids depending on
 * `vite/client` ambient types so the browser bundle stays self-contained.
 */
export type ViteHot = {
  on: (event: string, cb: (data: FormDockSnapshot | undefined) => void) => void;
  send: (event: string, data: FormDockSnapshot | undefined) => void;
};

/**
 * Returns Vite's per-module HMR client, present only in dev. Isolated in its own
 * module so the snapshot store can be unit-tested by mocking this accessor.
 */
export const getHot = (): ViteHot | undefined =>
  (import.meta as ImportMeta & { hot?: ViteHot }).hot;
