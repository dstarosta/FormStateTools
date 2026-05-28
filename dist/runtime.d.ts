//#region src/plugin/runtime.d.ts
/**
 * Mounts a transport-driven `FormDock` into its own container appended to
 * `document.body`. Used by the `form-state-tools` Vite plugin, which injects a
 * call to this function in dev only. The dock receives no `form` prop, so it
 * subscribes to snapshots pushed via `reportFormState`.
 */
declare const mountFormDock: () => void;
//#endregion
export { mountFormDock };
//# sourceMappingURL=runtime.d.ts.map