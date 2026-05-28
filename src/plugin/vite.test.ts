import { describe, expect, it, vi } from 'vitest';
import type { Plugin } from 'vite';

import formStateTools, { type FormStateToolsOptions } from './vite';
import { FORM_DOCK_EVENT } from './transport';

const VIRTUAL_ID = 'virtual:form-state-tools/mount';
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID;

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

type HtmlTag = { tag: string; attrs: Record<string, string>; injectTo: string };

const htmlTags = (plugin: Plugin): { order: string | undefined; tags: HtmlTag[] } => {
  const hook = plugin.transformIndexHtml as { order?: string; handler: Fn };
  return { order: hook.order, tags: hook.handler() as HtmlTag[] };
};

const withBase = (plugin: Plugin, base: string): void => {
  asFn(plugin.configResolved)({ base } as never);
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
  });

  describe('transform (SSR client-entry injection)', () => {
    it('injects the mount into the TanStack Start dev client entry', () => {
      const result = runTransform('\0virtual:tanstack-start-dev-client-entry');

      expect(result?.code).toContain('__fstMount()');
      expect(result?.code).toContain("from 'form-state-tools/runtime'");
    });

    it('injects into the TanStack Start production client entry', () => {
      const result = runTransform('\0virtual:tanstack-start-client-entry');

      expect(result?.code).toContain('__fstMount()');
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

    it('does not double-inject when the mount is already present', () => {
      const already = "import { mountFormDock as __fstMount } from 'form-state-tools/runtime';";

      expect(runTransform('\0virtual:tanstack-start-client-entry', already)).toBeUndefined();
    });

    it('honors a custom clientEntry target', () => {
      const result = runTransform('/src/entry-client.tsx', 'export {};', {
        clientEntry: 'entry-client',
      });

      expect(result?.code).toContain('__fstMount()');
    });

    it('does not match the default entries when clientEntry is set', () => {
      const result = runTransform('\0virtual:tanstack-start-client-entry', 'export {};', {
        clientEntry: 'entry-client',
      });

      expect(result).toBeUndefined();
    });

    it('ignores query suffixes on ids when matching', () => {
      const result = runTransform('\0virtual:tanstack-start-client-entry?v=123');

      expect(result?.code).toContain('__fstMount()');
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
    it('relays the snapshot event to all clients', () => {
      const handlers: Record<string, (data: unknown) => void> = {};
      const send = vi.fn();
      const server = {
        ws: {
          on: (event: string, cb: (data: unknown) => void) => {
            handlers[event] = cb;
          },
          send,
        },
      };

      const configureServer = asFn(getPlugin().configureServer);
      configureServer(server as never);

      const payload = { initialState: {}, formState: {}, formStatus: { valid: true } };
      handlers[FORM_DOCK_EVENT]?.(payload);

      expect(send).toHaveBeenCalledWith(FORM_DOCK_EVENT, payload);
    });
  });
});
