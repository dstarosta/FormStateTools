import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';

import PopupPortal from './popup-portal';

type FakePopupWindow = {
  document: Document;
  closed: boolean;
  close: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
};

const popupListeners = new Map<string, EventListener[]>();
const hostListeners = new Map<string, EventListener[]>();

let popupDoc: Document;
let popupWindow: FakePopupWindow;
let openSpy: MockInstance<typeof globalThis.open>;
let hostAddSpy: MockInstance<typeof globalThis.addEventListener>;
let hostRemoveSpy: MockInstance<typeof globalThis.removeEventListener>;

const createPopupWindow = (): FakePopupWindow => {
  popupDoc = document.implementation.createHTMLDocument('Form State Tools');
  popupListeners.clear();
  const win: FakePopupWindow = {
    document: popupDoc,
    closed: false,
    close: vi.fn(() => {
      win.closed = true;
    }),
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      const existing = popupListeners.get(type) ?? [];
      existing.push(listener);
      popupListeners.set(type, existing);
    }),
    removeEventListener: vi.fn(),
  };
  return win;
};

beforeEach(() => {
  vi.useFakeTimers();
  popupWindow = createPopupWindow();
  openSpy = vi.spyOn(globalThis, 'open').mockReturnValue(popupWindow as unknown as Window);

  hostListeners.clear();
  hostAddSpy = vi
    .spyOn(globalThis, 'addEventListener')
    .mockImplementation((type: string, listener: EventListenerOrEventListenerObject) => {
      const existing = hostListeners.get(type) ?? [];
      existing.push(listener as EventListener);
      hostListeners.set(type, existing);
    });
  hostRemoveSpy = vi.spyOn(globalThis, 'removeEventListener').mockImplementation(() => {});
});

afterEach(() => {
  act(() => {
    cleanup();
    vi.runAllTimers();
  });
  vi.useRealTimers();
  openSpy.mockRestore();
  hostAddSpy.mockRestore();
  hostRemoveSpy.mockRestore();
});

describe('PopupPortal', () => {
  it('opens a popup window and renders children into it', () => {
    render(
      <PopupPortal onClose={vi.fn()}>
        <span data-testid="popup-child">hello</span>
      </PopupPortal>
    );

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(popupDoc.querySelector('[data-testid="popup-child"]')?.textContent).toBe('hello');
  });

  it('passes screen-sized popup features to host.open', () => {
    Object.defineProperty(globalThis.screen, 'availWidth', { configurable: true, value: 1600 });
    Object.defineProperty(globalThis.screen, 'availHeight', { configurable: true, value: 900 });

    render(<PopupPortal onClose={vi.fn()}>x</PopupPortal>);

    const features = openSpy.mock.calls[0]?.[2];

    expect(features).toContain('popup');
    expect(features).toContain('width=1040');
    expect(features).toContain('height=500');
    expect(features).toContain('left=280');
    expect(features).toContain('top=200');
  });

  it('initializes the popup document chrome (title, body styles, container)', () => {
    render(<PopupPortal onClose={vi.fn()}>x</PopupPortal>);

    expect(popupDoc.title).toBe('Form State Tools');
    expect(popupDoc.documentElement.style.height).toBe('100%');
    expect(popupDoc.body.style.margin).toBe('0px');
    expect(popupDoc.body.style.height).toBe('100%');
    expect(popupDoc.body.children.length).toBeGreaterThan(0);
  });

  it('calls onClose when host.open returns null', () => {
    openSpy.mockReturnValueOnce(null);
    const onClose = vi.fn();

    render(<PopupPortal onClose={onClose}>x</PopupPortal>);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when host.open is not a function', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'open');
    openSpy.mockRestore();
    Object.defineProperty(globalThis, 'open', { configurable: true, value: undefined });

    try {
      const onClose = vi.fn();
      render(<PopupPortal onClose={onClose}>x</PopupPortal>);
      expect(onClose).toHaveBeenCalled();
    } finally {
      if (descriptor) {
        Object.defineProperty(globalThis, 'open', descriptor);
      }
      openSpy = vi.spyOn(globalThis, 'open').mockReturnValue(popupWindow as unknown as Window);
    }
  });

  it('calls onClose when the popup fires pagehide', () => {
    const onClose = vi.fn();
    render(<PopupPortal onClose={onClose}>x</PopupPortal>);

    const pagehideListeners = popupListeners.get('pagehide') ?? [];
    expect(pagehideListeners).toHaveLength(1);

    act(() => {
      pagehideListeners[0]?.(new Event('pagehide'));
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('closes the popup when the host fires beforeunload', () => {
    render(<PopupPortal onClose={vi.fn()}>x</PopupPortal>);

    const beforeUnloadListeners = hostListeners.get('beforeunload') ?? [];
    expect(beforeUnloadListeners).toHaveLength(1);

    act(() => {
      beforeUnloadListeners[0]?.(new Event('beforeunload'));
    });

    expect(popupWindow.close).toHaveBeenCalled();
    expect(popupWindow.closed).toBe(true);
  });

  it('closes the popup after unmount + cleanup timer fires', () => {
    const { unmount } = render(<PopupPortal onClose={vi.fn()}>x</PopupPortal>);

    expect(popupWindow.close).not.toHaveBeenCalled();

    act(() => {
      unmount();
    });

    expect(popupWindow.close).not.toHaveBeenCalled();

    act(() => {
      vi.runAllTimers();
    });

    expect(popupWindow.close).toHaveBeenCalled();
  });

  it('reuses the popup when remounted within the close window', () => {
    const { unmount } = render(<PopupPortal onClose={vi.fn()}>first</PopupPortal>);

    act(() => {
      unmount();
    });

    render(<PopupPortal onClose={vi.fn()}>second</PopupPortal>);

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(popupWindow.close).not.toHaveBeenCalled();
  });

  it('opens a new popup when the previous shared window was closed', () => {
    const { unmount } = render(<PopupPortal onClose={vi.fn()}>first</PopupPortal>);

    act(() => {
      unmount();
      vi.runAllTimers();
    });

    expect(popupWindow.close).toHaveBeenCalled();

    popupWindow = createPopupWindow();
    openSpy.mockReturnValueOnce(popupWindow as unknown as Window);

    render(<PopupPortal onClose={vi.fn()}>second</PopupPortal>);

    expect(openSpy).toHaveBeenCalledTimes(2);
  });

  describe('Style copying', () => {
    const originalStyleSheets = Object.getOwnPropertyDescriptor(Document.prototype, 'styleSheets');

    const stubStyleSheets = (sheets: object[]) => {
      Object.defineProperty(document, 'styleSheets', {
        configurable: true,
        get: () => sheets as unknown as StyleSheetList,
      });
    };

    afterEach(() => {
      if (originalStyleSheets) {
        Object.defineProperty(Document.prototype, 'styleSheets', originalStyleSheets);
      }
    });

    it('copies inline stylesheet rules into the popup head', () => {
      const ownerNode = document.createElement('style');
      ownerNode.id = 'app-style';
      const sheet = {
        cssRules: [
          { cssText: '.foo { color: red; }' } as CSSRule,
          { cssText: '.bar { color: blue; }' } as CSSRule,
        ],
        ownerNode,
        href: null,
        type: 'text/css',
        media: { toString: () => '' } as MediaList,
      };
      stubStyleSheets([sheet]);

      render(<PopupPortal onClose={vi.fn()}>x</PopupPortal>);

      const style = popupDoc.head.querySelector('style');

      expect(style).not.toBeNull();
      expect(style?.id).toBe('app-style');
      expect(style?.textContent).toContain('.foo');
      expect(style?.textContent).toContain('.bar');
    });

    it('falls back to a link element when cssRules access throws and the sheet has href', () => {
      const sheet = {
        get cssRules(): CSSRuleList {
          throw new Error('CORS');
        },
        ownerNode: null,
        href: 'https://example.com/site.css',
        type: 'text/css',
        media: { toString: () => 'screen' } as MediaList,
      };
      stubStyleSheets([sheet]);

      render(<PopupPortal onClose={vi.fn()}>x</PopupPortal>);

      const link = popupDoc.head.querySelector('link');

      expect(link).not.toBeNull();
      expect(link?.rel).toBe('stylesheet');
      expect(link?.href).toBe('https://example.com/site.css');
      expect(link?.media).toBe('screen');
    });

    it('skips a stylesheet that throws and has no href', () => {
      const sheet = {
        get cssRules(): CSSRuleList {
          throw new Error('CORS');
        },
        ownerNode: null,
        href: null,
        type: 'text/css',
        media: { toString: () => '' } as MediaList,
      };
      stubStyleSheets([sheet]);

      render(<PopupPortal onClose={vi.fn()}>x</PopupPortal>);

      expect(popupDoc.head.querySelector('style')).toBeNull();
      expect(popupDoc.head.querySelector('link')).toBeNull();
    });

    it('skips the owner-node id attribute when the node has no usable id', () => {
      const ownerNode = document.createElement('style');
      const sheet = {
        cssRules: [{ cssText: '.x{}' } as CSSRule],
        ownerNode,
        href: null,
        type: 'text/css',
        media: { toString: () => '' } as MediaList,
      };
      stubStyleSheets([sheet]);

      render(<PopupPortal onClose={vi.fn()}>x</PopupPortal>);

      const style = popupDoc.head.querySelector('style');

      expect(style).not.toBeNull();
      expect(style?.hasAttribute('id')).toBe(false);
    });
  });
});
