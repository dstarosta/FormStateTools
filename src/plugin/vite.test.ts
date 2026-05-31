import { describe, expect, it, vi } from 'vitest';
import type { Plugin } from 'vite';

import formStateTools, { type FormStateToolsOptions } from './vite';
import { FORM_DOCK_EVENT } from './transport';

const VIRTUAL_ID = 'virtual:form-state-tools/mount';
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID;

// What the transform hook appends to a matched client entry.
const INJECTED_IMPORT = `import '${VIRTUAL_ID}';`;

const getPlugin = (options?: FormStateToolsOptions): Plugin => formStateTools(options);

// The hooks are declared as plain functions on our plugin object, so we can call
// them directly. These helpers narrow the Vite ObjectHook union for the tests.
type Fn = (...args: never[]) => unknown;
const asFn = (hook: unknown): Fn => {
  if (typeof hook === 'function') {
    return hook as Fn;
  }
  throw new TypeError('expected a function hook');
};

const runTransform = (
  id: string,
  code = 'export const x = 1;',
  options?: FormStateToolsOptions
): { code: string } | undefined => {
  const transform = asFn(getPlugin(options).transform);
  return transform(code as never, id as never) as { code: string } | undefined;
};

const loadMountCode = (options?: FormStateToolsOptions): string =>
  asFn(getPlugin(options).load)(RESOLVED_VIRTUAL_ID as never) as string;

type HtmlTag = { tag: string; attrs: Record<string, string>; injectTo: string };

const htmlTags = (plugin: Plugin): { order: string | undefined; tags: HtmlTag[] } => {
  const hook = plugin.transformIndexHtml as { order?: string; handler: Fn };
  return { order: hook.order, tags: hook.handler() as HtmlTag[] };
};

const resolveConfig = (
  plugin: Plugin,
  config: { base?: string; plugins?: Array<{ name: string }> } = {}
): void => {
  asFn(plugin.configResolved)({
    base: config.base ?? '/',
    plugins: config.plugins ?? [],
  } as never);
};

const withBase = (plugin: Plugin, base: string): void => {
  resolveConfig(plugin, { base });
};

const withReactRouter = (plugin: Plugin): void => {
  resolveConfig(plugin, { plugins: [{ name: 'vite:react-router' }] });
};

const transformWithRR = (id: string, code = 'export {};'): { code: string } | undefined => {
  const plugin = getPlugin();
  withReactRouter(plugin);
  const transform = asFn(plugin.transform);
  return transform(code as never, id as never) as { code: string } | undefined;
};

const setupRelay = () => {
  const handlers: Record<string, (data: unknown, client: unknown) => void> = {};
  const sender = { send: vi.fn() };
  const other = { send: vi.fn() };
  const server = {
    ws: {
      on: (event: string, cb: (data: unknown, client: unknown) => void) => {
        handlers[event] = cb;
      },
      clients: new Set([sender, other]),
    },
  };

  asFn(getPlugin().configureServer)(server as never);

  return { handlers, sender, other };
};

describe('formStateTools vite plugin', () => {
  it('has a stable name and runs before other plugins', () => {
    const plugin = getPlugin();

    expect(plugin.name).toBe('form-state-tools');
    expect(plugin.enforce).toBe('pre');
  });

  describe('apply (dev-only gating)', () => {
    it("defaults to 'serve' so it is stripped from production builds", () => {
      expect(getPlugin().apply).toBe('serve');
    });

    it('is inert when enabled is false', () => {
      const apply = getPlugin({ enabled: false }).apply;

      expect(typeof apply).toBe('function');
      expect((apply as () => boolean)()).toBe(false);
    });

    it('always applies when enabled is true', () => {
      const apply = getPlugin({ enabled: true }).apply;

      expect(typeof apply).toBe('function');
      expect((apply as () => boolean)()).toBe(true);
    });
  });

  describe('resolveId / load (virtual mount module)', () => {
    it('resolves the virtual mount id', () => {
      const resolveId = asFn(getPlugin().resolveId);

      expect(resolveId(VIRTUAL_ID as never)).toBe(RESOLVED_VIRTUAL_ID);
    });

    it('ignores unrelated ids', () => {
      const resolveId = asFn(getPlugin().resolveId);

      expect(resolveId('some-other-module' as never)).toBeUndefined();
    });

    it('loads runtime-importing mount code for the resolved virtual id', () => {
      const load = asFn(getPlugin().load);
      const code = load(RESOLVED_VIRTUAL_ID as never) as string;

      expect(code).toContain("from 'form-state-tools/runtime'");
      expect(code).toContain('mountFormDock()');
    });

    it('does not load unrelated ids', () => {
      const load = asFn(getPlugin().load);

      expect(load('virtual:something-else' as never)).toBeUndefined();
    });

    it('omits the options argument when no dock options are set', () => {
      expect(loadMountCode()).toContain('mountFormDock();');
    });

    it('forwards collapsed and captureErrors to the mount call', () => {
      const code = loadMountCode({ collapsed: false, captureErrors: 'console' });

      expect(code).toContain('mountFormDock({ collapsed: false, captureErrors: "console" });');
    });

    it('emits string patterns as JSON-quoted literals', () => {
      const code = loadMountCode({ ignoreErrorPatterns: ['ignore me'] });

      expect(code).toContain('ignoreErrorPatterns: ["ignore me"]');
    });

    it('emits RegExp patterns as literals, preserving flags', () => {
      const code = loadMountCode({ ignoreErrorPatterns: [/boom/gi, 'plain'] });

      expect(code).toContain('ignoreErrorPatterns: [/boom/gi, "plain"]');
    });

    it('includes only the options that are explicitly set', () => {
      const code = loadMountCode({ collapsed: true });

      expect(code).toContain('mountFormDock({ collapsed: true });');
      expect(code).not.toContain('captureErrors');
      expect(code).not.toContain('ignoreErrorPatterns');
    });
  });

  describe('transform (SSR client-entry injection)', () => {
    it('injects the mount into the TanStack Start dev client entry', () => {
      const result = runTransform('\0virtual:tanstack-start-dev-client-entry');

      expect(result?.code).toContain(INJECTED_IMPORT);
    });

    it('injects into the TanStack Start production client entry', () => {
      const result = runTransform('\0virtual:tanstack-start-client-entry');

      expect(result?.code).toContain(INJECTED_IMPORT);
    });

    it('preserves the original module code', () => {
      const result = runTransform('\0virtual:tanstack-start-client-entry', 'const original = 42;');

      expect(result?.code).toContain('const original = 42;');
    });

    it('does not inject into unrelated modules', () => {
      expect(runTransform('/src/components/Button.tsx')).toBeUndefined();
    });

    it('skips node_modules', () => {
      expect(runTransform('/node_modules/virtual:tanstack-start-client-entry')).toBeUndefined();
    });

    it('skips the SSR pass (only injects into the client build)', () => {
      const transform = asFn(getPlugin().transform);
      const result = transform(
        'export {};' as never,
        '\0virtual:tanstack-start-client-entry' as never,
        { ssr: true } as never
      );

      expect(result).toBeUndefined();
    });

    it('does not double-inject when the mount is already present', () => {
      const already = INJECTED_IMPORT;

      expect(runTransform('\0virtual:tanstack-start-client-entry', already)).toBeUndefined();
    });

    it('honors a custom clientEntry target', () => {
      const result = runTransform('/src/entry-client.tsx', 'export {};', {
        clientEntry: 'entry-client',
      });

      expect(result?.code).toContain(INJECTED_IMPORT);
    });

    it('does not match the default entries when clientEntry is set', () => {
      const result = runTransform('\0virtual:tanstack-start-client-entry', 'export {};', {
        clientEntry: 'entry-client',
      });

      expect(result).toBeUndefined();
    });

    it('ignores query suffixes on ids when matching', () => {
      const result = runTransform('\0virtual:tanstack-start-client-entry?v=123');

      expect(result?.code).toContain(INJECTED_IMPORT);
    });
  });

  describe('transform (React Router auto-detection)', () => {
    it('injects into the app root module when React Router is detected', () => {
      expect(transformWithRR('/app/root.tsx')?.code).toContain(INJECTED_IMPORT);
    });

    it('matches root.jsx as well', () => {
      expect(transformWithRR('/app/root.jsx')?.code).toContain(INJECTED_IMPORT);
    });

    it('does not match modules that merely contain "root"', () => {
      expect(transformWithRR('/app/RootProvider.tsx')).toBeUndefined();
      expect(transformWithRR('/app/app-root.tsx')).toBeUndefined();
      expect(transformWithRR('/src/root-layout.tsx')).toBeUndefined();
    });

    it('does not match a node_modules root module', () => {
      expect(transformWithRR('/node_modules/@react-router/dev/dist/root.tsx')).toBeUndefined();
    });

    it('does not target root without React Router detected', () => {
      // Default plugin, no configResolved with the RR plugin present.
      expect(runTransform('/app/root.tsx')).toBeUndefined();
    });

    it('skips the index.html path when React Router is detected', () => {
      const plugin = getPlugin();
      withReactRouter(plugin);

      expect(htmlTags(plugin).tags).toHaveLength(0);
    });
  });

  describe('transformIndexHtml (SPA injection)', () => {
    it('uses the object hook form (order: post) so Vite 7+/8 invokes it', () => {
      expect(htmlTags(getPlugin()).order).toBe('post');
    });

    it('injects a module script referencing the virtual mount by URL', () => {
      const { tags } = htmlTags(getPlugin());

      expect(tags).toHaveLength(1);
      expect(tags[0]?.tag).toBe('script');
      expect(tags[0]?.attrs['type']).toBe('module');
      expect(tags[0]?.attrs['src']).toBe(`/@id/${VIRTUAL_ID}`);
      expect(tags[0]?.injectTo).toBe('body');
    });

    it('prefixes the script src with a non-root base', () => {
      const plugin = getPlugin();
      withBase(plugin, '/form/');

      expect(htmlTags(plugin).tags[0]?.attrs['src']).toBe(`/form/@id/${VIRTUAL_ID}`);
    });

    it('injects nothing into the HTML when clientEntry is set (caller controls it)', () => {
      const plugin = getPlugin({ clientEntry: 'entry-client' });

      expect(htmlTags(plugin).tags).toHaveLength(0);
    });
  });

  describe('configureServer (ws relay)', () => {
    it('relays the snapshot to other connected clients', () => {
      const { handlers, other } = setupRelay();
      const payload = { initialState: {}, formState: {}, formStatus: { valid: true } };

      handlers[FORM_DOCK_EVENT]?.(payload, { send: vi.fn() });

      expect(other.send).toHaveBeenCalledWith(FORM_DOCK_EVENT, payload);
    });

    it('does not echo the snapshot back to the sender', () => {
      const { handlers, sender } = setupRelay();
      const payload = { initialState: {}, formState: {}, formStatus: { valid: true } };

      handlers[FORM_DOCK_EVENT]?.(payload, sender);

      expect(sender.send).not.toHaveBeenCalled();
    });
  });
});
