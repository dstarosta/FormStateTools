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

vi.mock('../../src/form-dock', () => ({
  default: () => null,
}));

const { mountFormDock } = await import('../../src/plugin/runtime');

const CONTAINER_SELECTOR = '#__form-state-tools-root';

const setReadyState = (value: DocumentReadyState) => {
  Object.defineProperty(document, 'readyState', {
    value,
    configurable: true,
  });
};

describe('mountFormDock', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    createRoot.mockClear();
    render.mockClear();
    setReadyState('complete');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('appends a container to the body and renders into it (page already loaded)', () => {
    mountFormDock();

    expect(createRoot).not.toHaveBeenCalled();

    vi.runAllTimers();

    const container = document.querySelector(CONTAINER_SELECTOR);

    expect(container).toBeTruthy();
    expect(container?.parentElement).toBe(document.body);
    expect(createRoot).toHaveBeenCalledWith(container);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('waits for the load event when the page is still loading', () => {
    setReadyState('loading');

    mountFormDock();
    dispatchEvent(new Event('load'));

    expect(createRoot).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(createRoot).toHaveBeenCalledTimes(1);
  });

  it('is idempotent: a second call does not create a second container or root', () => {
    mountFormDock();
    mountFormDock();
    vi.runAllTimers();

    expect(document.querySelectorAll(CONTAINER_SELECTOR)).toHaveLength(1);
    expect(createRoot).toHaveBeenCalledTimes(1);
  });

  it('does nothing when there is no document (SSR)', () => {
    const original = document;

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
