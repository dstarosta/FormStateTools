import type { Plugin } from 'vite';

import { FORM_DOCK_EVENT } from './transport';

const VIRTUAL_ID = 'virtual:form-state-tools/mount';
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID;

export type FormStateToolsOptions = {
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
 * Known client-entry module ids for SSR frameworks that render the document
 * themselves (so `transformIndexHtml` never fires). The dock mount is appended
 * to whichever one a given app uses. These are stable framework entry points,
 * not user files, so injection does not depend on how the app names its modules.
 */
const CLIENT_ENTRY_IDS = [
  'virtual:tanstack-start-dev-client-entry',
  'virtual:tanstack-start-client-entry',
];

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
function formStateTools(options: FormStateToolsOptions = {}): Plugin {
  const { enabled, clientEntry } = options;

  const mountImport = `\nimport { mountFormDock as __fstMount } from 'form-state-tools/runtime';\n__fstMount();\n`;

  // Vite's `base`, captured at config resolution so the injected <script src>
  // resolves correctly under a non-root base (e.g. base: '/form').
  let base = '/';

  const matchesInjectionTarget = (id: string): boolean => {
    const cleanId = id.split('?')[0] ?? id;
    if (clientEntry) {
      return cleanId.includes(clientEntry);
    }
    // Default: the framework's client entry. `mountFormDock` is `document`-guarded,
    // so appending is a no-op on the server and mounts once on the client.
    return CLIENT_ENTRY_IDS.some((entry) => cleanId.includes(entry));
  };

  return {
    name: 'form-state-tools',
    apply: enabled === undefined ? 'serve' : () => enabled,
    enforce: 'pre',

    configResolved(config) {
      base = config.base;
    },

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_VIRTUAL_ID : undefined;
    },

    load(id) {
      // The virtual module Vite serves as a real script; bare specifiers inside
      // it are resolved normally (unlike bare imports in an inline HTML script).
      return id === RESOLVED_VIRTUAL_ID
        ? `import { mountFormDock } from 'form-state-tools/runtime';\nmountFormDock();\n`
        : undefined;
    },

    transform(code, id) {
      // Injection path for SSR frameworks (e.g. TanStack Start) that render the
      // document themselves, so `transformIndexHtml` never fires. Appends the
      // dock mount to the framework client entry. Skip node_modules and self.
      const skip = id.includes('node_modules') || code.includes('__fstMount');
      return !skip && matchesInjectionTarget(id)
        ? { code: code + mountImport, map: null }
        : undefined;
    },

    // Injection path for plain Vite/React SPAs that serve an index.html. Uses the
    // object hook form ({ order, handler }) required by Vite 7+/8, and references
    // the virtual mount module by URL (not an inline bare import, which the
    // browser cannot resolve) so Vite remaps its imports.
    //
    // When `clientEntry` is set, the caller is taking control of injection via the
    // transform path, so this HTML path stays out of the way to avoid a second
    // (HTML-injected) dock.
    transformIndexHtml: {
      order: 'post',
      handler() {
        if (clientEntry) {
          return [];
        }
        const src = `${base.replace(/\/$/, '')}/@id/${VIRTUAL_ID}`;
        return [
          {
            tag: 'script',
            attrs: { type: 'module', src },
            injectTo: 'body',
          },
        ];
      },
    },

    configureServer(server) {
      // Relay snapshots from the emitting client to every other connected client
      // so a detached dock window / other tabs stay in sync. The emitting page
      // updates its own in-page dock directly, so we do not echo back to sender
      // (Vite's broadcast reaches all clients; that is acceptable and idempotent).
      server.ws.on(FORM_DOCK_EVENT, (data) => {
        server.ws.send(FORM_DOCK_EVENT, data);
      });
    },
  };
}

export default formStateTools;
