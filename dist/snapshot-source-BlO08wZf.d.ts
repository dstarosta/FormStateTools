//#region src/plugin/transport.d.ts
/**
 * The serializable shape the `FormDock` panel renders.
 *
 * The panel only ever reads `initialState`, `formState` and `formStatus`, and it
 * `JSON.stringify`s them before rendering. So the transport carries plain JSON,
 * not the live `FormStateResponse` instance — any source (TanStack Form, a custom
 * store, the `form-state` library) can produce a snapshot.
 */
type FormDockSnapshot = {
  initialState: {
    data: unknown;
    errors: Record<string, string | undefined>;
  };
  formState: unknown;
  formStatus: {
    /**
     * Whether the form is valid. `null` means "not yet validated" and renders the
     * uninitialized indicator; `false` renders the invalid indicator.
     */
    valid: boolean | null;
    [key: string]: unknown;
  };
};
//#endregion
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
export { FormDockSnapshot as n, reportFormState as t };
//# sourceMappingURL=snapshot-source-BlO08wZf.d.ts.map