import { n as FormDockSnapshot } from "./snapshot-source-BlO08wZf.js";

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
export { useFormDock as t };
//# sourceMappingURL=use-form-dock-BVxt6UbK.d.ts.map