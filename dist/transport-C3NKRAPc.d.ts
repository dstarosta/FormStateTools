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
export { FormDockSnapshot as t };
//# sourceMappingURL=transport-C3NKRAPc.d.ts.map