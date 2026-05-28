import { createRoot } from 'react-dom/client';

import FormDock from '../form-dock';

const CONTAINER_ID = '__form-state-tools-root';

const mountNow = (): void => {
  if (document.querySelector(`#${CONTAINER_ID}`)) {
    return;
  }

  const container = document.createElement('div');
  container.id = CONTAINER_ID;
  document.body.append(container);

  createRoot(container).render(<FormDock devMode />);
};

// Wait a beat past hydration before mounting the dock's separate root.
const deferMount = (): void => {
  setTimeout(mountNow, 200);
};

/**
 * Mounts a transport-driven `FormDock` into its own container appended to
 * `document.body`. Used by the `form-state-tools` Vite plugin, which injects a
 * call to this function in dev only. The dock receives no `form` prop, so it
 * subscribes to snapshots pushed via `reportFormState`.
 *
 * The mount is deferred until *after* the host app has hydrated, so the dock's
 * separate React root does not initialize while hydration is in flight. Mounting
 * a second root mid-hydration disrupts in-flight transitions — under SSR
 * frameworks (React Router, TanStack Start) this silently breaks
 * transition-based work such as form validation. The running second root itself
 * is fine; only the timing matters.
 *
 * The `window` load event is a stronger "hydration has run" signal than an idle
 * callback (which can fire before hydration commits); a short timeout past it
 * lands clear of hydration.
 */
export const mountFormDock = (): void => {
  if (typeof document !== 'object') {
    return;
  }

  if (document.readyState === 'complete') {
    deferMount();
  } else {
    globalThis.addEventListener('load', deferMount, { once: true });
  }
};
