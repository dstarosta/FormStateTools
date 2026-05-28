import { Plugin } from "vite";

//#region src/plugin/vite.d.ts
type FormStateToolsOptions = {
  /**
   * Override automatic dev-only behavior. When `true` the dock is injected even
   * in non-serve modes; when `false` the plugin is inert. Defaults to dev-only.
   */
  enabled?: boolean;
  /**
   * A substring matched against module ids to locate your app's client-entry
   * module (the JS/TS file that runs in the browser, e.g. `entry-client.tsx`).
   * The dock mount is appended there. Only needed for SSR setups whose client
   * entry is not auto-detected — not for SPAs (which use `index.html`) or
   * TanStack Start (auto-detected).
   *
   * This must name a JavaScript module, not an HTML file. Setting it takes full
   * control of injection: the `index.html` script path is disabled, so the dock
   * is mounted solely via the module matched here.
   */
  clientEntry?: string;
};
/**
 * Vite plugin that auto-injects the `FormDock` developer panel and relays form
 * state snapshots between clients (the in-page dock, a detached window, other
 * tabs) over Vite's HMR websocket.
 *
 * The plugin only applies during `vite dev` (serve), so the dock and its imports
 * never reach a production bundle.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import formStateTools from 'form-state-tools/vite';
 * export default { plugins: [formStateTools()] };
 * ```
 */
declare function formStateTools(options?: FormStateToolsOptions): Plugin;
//#endregion
export { FormStateToolsOptions, formStateTools as default };