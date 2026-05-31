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
 * When the form unmounts, the snapshot is cleared so the dock behaves as if it
 * is no longer rendered.
 *
 * In a production build `reportFormState` is a no-op, so this hook costs nothing.
 */
declare const useFormDock: (form: FormDockSnapshot) => void;
//#endregion
export { useFormDock as t };
//# sourceMappingURL=use-form-dock-BoWWS0id.d.ts.map