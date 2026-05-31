import { n as ErrorPattern, t as CapturedErrorLevel } from "./form-dock-XwceV8w1.js";

//#region src/plugin/runtime.d.ts
/**
 * Dock configuration the Vite plugin forwards to the injected `FormDock`. These
 * mirror the matching `FormDockProps` and are passed by the plugin-generated
 * virtual module; all are optional so the call site can omit any of them.
 */
type MountFormDockOptions = {
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
declare const mountFormDock: (options?: MountFormDockOptions) => void;
//#endregion
export { MountFormDockOptions, mountFormDock };
//# sourceMappingURL=runtime.d.ts.map