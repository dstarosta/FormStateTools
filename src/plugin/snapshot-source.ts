import { type FormDockSnapshot, FORM_DOCK_EVENT } from './transport';
import { getHot } from './vite-hot';

type Listener = () => void;

let current: FormDockSnapshot | undefined;
const listeners = new Set<Listener>();

const emitToListeners = () => {
  for (const listener of listeners) {
    listener();
  }
};

const setSnapshot = (snapshot: FormDockSnapshot) => {
  current = snapshot;
  emitToListeners();
};

/**
 * `useSyncExternalStore` subscribe contract. Also lazily wires the dev transport
 * the first time the dock subscribes, so snapshots relayed from other tabs /
 * the detached window arrive here too.
 */
export const subscribeToSnapshots = (listener: Listener): (() => void) => {
  ensureTransport();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const getSnapshot = (): FormDockSnapshot | undefined => current;

/**
 * Server snapshot for `useSyncExternalStore`. There is never form state during
 * SSR, so the dock renders nothing until the client hydrates and snapshots arrive.
 */
export const getServerSnapshot = (): FormDockSnapshot | undefined => undefined;

let transportWired = false;

const ensureTransport = () => {
  if (transportWired) {
    return;
  }
  transportWired = true;

  // Vite injects `import.meta.hot` only in dev. In a production build this branch
  // is dead and tree-shakes out.
  const hot = getHot();
  if (hot) {
    hot.on(FORM_DOCK_EVENT, (snapshot) => {
      setSnapshot(snapshot);
    });
  }
};

/**
 * Push the current form state to the dock. Call this from your form code whenever
 * the form state changes (e.g. inside a TanStack Form `useStore`/`subscribe`).
 *
 * Updates the in-page dock immediately and, in dev, relays the snapshot over the
 * Vite transport so a detached dock window or other tabs stay in sync. In a
 * production build this is a no-op that tree-shakes away.
 */
export const reportFormState = (snapshot: FormDockSnapshot): void => {
  setSnapshot(snapshot);

  const hot = getHot();
  if (hot) {
    hot.send(FORM_DOCK_EVENT, snapshot);
  }
};

export { type FormDockSnapshot } from './transport';
