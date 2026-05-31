import { createRoot } from 'react-dom/client';

import FormDock, { type CapturedErrorLevel, type ErrorPattern } from '../form-dock';

const CONTAINER_ID = '__form-state-tools-root';

/**
 * Dock configuration the Vite plugin forwards to the injected `FormDock`. These
 * mirror the matching `FormDockProps` and are passed by the plugin-generated
 * virtual module; all are optional so the call site can omit any of them.
 */
export type MountFormDockOptions = {
  /**
   * Whether the dock starts in its collapsed state. Defaults to `true`.
   */
  collapsed?: boolean;
  /**
   * Which kinds of errors the dock surfaces as an on-screen toast.
   *
   * @see {@link CapturedErrorLevel}
   */
  captureErrors?: CapturedErrorLevel;
  /**
   * Patterns for errors the dock should not show. An error is ignored when its
   * message matches any of these `string` or `RegExp` patterns. Defaults to an
   * empty list.
   *
   * @see {@link ErrorPattern}
   */
  ignoreErrorPatterns?: ErrorPattern[];
};

const mountNow = (options: MountFormDockOptions): void => {
  if (document.querySelector(`#${CONTAINER_ID}`)) {
    return;
  }

  const container = document.createElement('div');
  container.id = CONTAINER_ID;
  document.body.append(container);

  createRoot(container).render(<FormDock devMode {...options} />);
};

// Wait a beat past hydration before mounting the dock's separate root.
const deferMount = (options: MountFormDockOptions): void => {
  setTimeout(() => {
    mountNow(options);
  }, 200);
};

/**
 * Mounts a transport-driven `FormDock` into its own container appended to
 * `document.body`. Used by the `form-state-tools` Vite plugin, which injects a
 * call to this function in dev only. The dock receives no `form` prop, so it
 * subscribes to snapshots pushed via `reportFormState`.
 *
 * `options` carries the dock UI configuration (`collapsed`, `captureErrors`,
 * `ignoreErrorPatterns`) forwarded from the plugin's options.
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
export const mountFormDock = (options: MountFormDockOptions = {}): void => {
  if (typeof document !== 'object') {
    return;
  }

  if (document.readyState === 'complete') {
    deferMount(options);
  } else {
    globalThis.addEventListener(
      'load',
      () => {
        deferMount(options);
      },
      { once: true }
    );
  }
};
