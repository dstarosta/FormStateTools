/**
 * The serializable shape the `FormDock` panel renders.
 *
 * The panel only ever reads `initialState`, `formState` and `formStatus`, and it
 * `JSON.stringify`s them before rendering. So the transport carries plain JSON,
 * not the live `FormStateResponse` instance — any source (TanStack Form, a custom
 * store, the `form-state` library) can produce a snapshot.
 */
export type FormDockSnapshot = {
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

/**
 * The HMR channel event name used to ferry snapshots from app code to the
 * plugin-injected dock. Shared by the client and the Vite plugin so they agree
 * on the wire contract.
 */
export const FORM_DOCK_EVENT = 'form-state-tools:snapshot';
