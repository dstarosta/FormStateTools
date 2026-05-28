import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const render = vi.fn();
const createRoot = vi.fn((container: Element) => ({
  container,
  render,
  unmount: vi.fn(),
}));

vi.mock('react-dom/client', () => ({
  createRoot: (container: Element) => createRoot(container),
}));

vi.mock('../form-dock', () => ({
  default: () => null,
}));

const { mountFormDock } = await import('./runtime');

const CONTAINER_SELECTOR = '#__form-state-tools-root';

describe('mountFormDock', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    createRoot.mockClear();
    render.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('appends a container to the body and renders into it', () => {
    mountFormDock();

    const container = document.querySelector(CONTAINER_SELECTOR);
    expect(container).toBeTruthy();
    expect(container?.parentElement).toBe(document.body);
    expect(createRoot).toHaveBeenCalledWith(container);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('is idempotent: a second call does not create a second container or root', () => {
    mountFormDock();
    mountFormDock();

    expect(document.querySelectorAll(CONTAINER_SELECTOR)).toHaveLength(1);
    expect(createRoot).toHaveBeenCalledTimes(1);
  });

  it('does nothing when there is no document (SSR)', () => {
    const original = globalThis.document;
    // Simulate a non-browser environment.
    Object.defineProperty(globalThis, 'document', {
      value: undefined,
      configurable: true,
    });

    try {
      expect(() => {
        mountFormDock();
      }).not.toThrow();
      expect(createRoot).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(globalThis, 'document', {
        value: original,
        configurable: true,
      });
    }
  });
});
