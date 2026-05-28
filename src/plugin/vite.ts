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
   * entry is not auto-detected — not for SPAs (which use `index.html`),
   * TanStack Start, or React Router (Remix) (all auto-detected).
   *
   * This must name a JavaScript module, not an HTML file. Setting it takes full
   * control of injection: the `index.html` script path is disabled, so the dock
   * is mounted solely via the module matched here.
   */
  clientEntry?: string;
};

/**
 * Known client-entry module ids for SSR frameworks.
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

  const mountImport = `\nimport '${VIRTUAL_ID}';\n`;

  let base = '/';
  let isReactRouter = false;

  const ROOT_MODULE = /[/\\]root\.[cm]?[jt]sx$/;

  const matchesInjectionTarget = (id: string): boolean => {
    const cleanId = id.split('?')[0] ?? id;
    if (clientEntry) {
      return cleanId.includes(clientEntry);
    }

    if (isReactRouter && ROOT_MODULE.test(cleanId)) {
      return true;
    }

    return CLIENT_ENTRY_IDS.some((entry) => cleanId.includes(entry));
  };

  return {
    name: 'form-state-tools',
    apply: enabled === undefined ? 'serve' : () => enabled,
    enforce: 'pre',

    configResolved(config) {
      base = config.base;
      isReactRouter = config.plugins.some((p) => p.name.includes('react-router'));
    },

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_VIRTUAL_ID : undefined;
    },

    load(id) {
      return id === RESOLVED_VIRTUAL_ID
        ? `import { mountFormDock } from 'form-state-tools/runtime';\nmountFormDock();\n`
        : undefined;
    },

    transform(code, id, transformOptions) {
      const skip =
        transformOptions?.ssr || id.includes('node_modules') || code.includes(VIRTUAL_ID);
      return !skip && matchesInjectionTarget(id)
        ? { code: code + mountImport, map: null }
        : undefined;
    },

    transformIndexHtml: {
      order: 'post',
      handler() {
        if (clientEntry || isReactRouter) {
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
      server.ws.on(FORM_DOCK_EVENT, (data, client) => {
        for (const serverClient of server.ws.clients) {
          if (serverClient !== client) {
            serverClient.send(FORM_DOCK_EVENT, data);
          }
        }
      });
    },
  };
}

export default formStateTools;
