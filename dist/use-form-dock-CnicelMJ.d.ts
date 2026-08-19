import { t as FormDockSnapshot } from "./transport-C3NKRAPc.js";
//#region src/plugin/snapshot-source.d.ts
/**
 * Push the current form state to the dock. Call this from your form code whenever
 * the form state changes (e.g. inside a TanStack Form `useStore`/`subscribe`).
 *
 * Updates the in-page dock immediately and, in dev, relays the snapshot over the
 * Vite transport so a detached dock window or other tabs stay in sync. In a
 * production build this is a no-op that tree-shakes away.
 */
declare const reportFormState: (snapshot: FormDockSnapshot) => void;
//#endregion
//#region src/use-form-dock.d.ts
/**
 * Reports the given form snapshot to the plugin-injected `FormDock` whenever it
 * changes. Use this instead of wiring `reportFormState` in your own effect.
 *
 * The `form` object from the `form-state` library is already snapshot-shaped, so
 * it can be passed directly:
 *
 * @example
 * ```tsx
 * const form = useFormState(schema);
 * useFormDock(form);
 * ```
 *
 * Pass `enabled` to control whether the snapshot is reported. When it is `false`
 * the dock behaves as if no form is rendered (the snapshot is cleared); toggling
 * it back to `true` resumes reporting. Defaults to `true` (always shown).
 *
 * @example
 * ```tsx
 * // Only show the dock when the URL carries `?devtools=true`.
 * useFormDock(form, new URLSearchParams(location.search).get('devtools') === 'true');
 * ```
 *
 * When the form unmounts, the snapshot is cleared so the dock behaves as if it
 * is no longer rendered.
 *
 * In a production build `reportFormState` is a no-op, so this hook costs nothing.
 */
declare const useFormDock: (form: FormDockSnapshot, enabled?: boolean) => void;
//#endregion
export { reportFormState as n, useFormDock as t };
//# sourceMappingURL=use-form-dock-CnicelMJ.d.ts.map