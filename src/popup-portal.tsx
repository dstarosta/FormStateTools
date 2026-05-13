import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { PANEL_BACKGROUND_COLOR } from './colors';

type PopupPortalProps = Readonly<{
  onClose: () => void;
  children: React.ReactNode;
}>;

type PortalTarget = {
  window: Window;
  container: HTMLElement;
};

const POPUP_NAME = 'form-state-tools-dock';
const POPUP_WIDTH_RATIO = 0.65;
const POPUP_HEIGHT = 500;

const getPopupFeatures = (host: Window): string => {
  const { availWidth, availHeight } = host.screen;
  const width = Math.round(availWidth * POPUP_WIDTH_RATIO);
  const left = Math.round((availWidth - width) / 2);
  const top = Math.round((availHeight - POPUP_HEIGHT) / 2);

  return `popup,width=${String(width)},height=${String(POPUP_HEIGHT)},left=${String(left)},top=${String(top)}`;
};

let shared: PortalTarget | null = null;
let activeMounts = 0;
let pendingCloseTimer: ReturnType<typeof setTimeout> | null = null;

const copyStyles = (source: Document, target: Document) => {
  for (const styleSheet of source.styleSheets) {
    try {
      const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
      const style = target.createElement('style');
      const ownerNode = styleSheet.ownerNode;

      if (ownerNode && 'id' in ownerNode && typeof ownerNode.id === 'string' && ownerNode.id) {
        style.setAttribute('id', ownerNode.id);
      }
      style.textContent = cssRules;

      target.head.append(style);
    } catch {
      if (!styleSheet.href) {
        continue;
      }

      const link = target.createElement('link');
      link.rel = 'stylesheet';
      link.type = styleSheet.type;
      link.media = styleSheet.media.toString();
      link.href = styleSheet.href;

      target.head.append(link);
    }
  }
};

const closeShared = () => {
  if (shared && !shared.window.closed) {
    shared.window.close();
  }
  shared = null;
};

function PopupPortal({ onClose, children }: PopupPortalProps) {
  const [target, setTarget] = useState<PortalTarget | null>(null);

  useEffect(() => {
    const host = globalThis.window as Window | undefined;

    if (!host || typeof host.open !== 'function') {
      onClose();
      return;
    }

    activeMounts++;

    // A pending close from a previous cleanup means StrictMode (or HMR) is
    // re-mounting us. Cancel the close and reuse the existing window.
    if (pendingCloseTimer !== null) {
      clearTimeout(pendingCloseTimer);
      pendingCloseTimer = null;
    }

    if (!shared || shared.window.closed) {
      const opened = host.open('', POPUP_NAME, getPopupFeatures(host));

      if (!opened) {
        activeMounts--;
        onClose();
        return;
      }

      opened.document.head.innerHTML = '';
      opened.document.body.innerHTML = '';
      opened.document.title = 'Form State Tools';
      opened.document.documentElement.style.height = '100%';
      opened.document.documentElement.style.background = PANEL_BACKGROUND_COLOR;
      opened.document.body.style.margin = '0';
      opened.document.body.style.height = '100%';
      opened.document.body.style.background = PANEL_BACKGROUND_COLOR;
      opened.document.body.style.fontFamily = '"Inter", ui-sans-serif, system-ui, sans-serif';

      copyStyles(document, opened.document);

      const container = opened.document.createElement('div');
      opened.document.body.append(container);

      shared = { window: opened, container };
    }

    const active = shared;

    const handlePopupClose = () => {
      onClose();
    };
    const handleHostUnload = () => {
      closeShared();
    };

    active.window.addEventListener('pagehide', handlePopupClose);
    host.addEventListener('beforeunload', handleHostUnload);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTarget(active);

    return () => {
      activeMounts--;

      active.window.removeEventListener('pagehide', handlePopupClose);
      host.removeEventListener('beforeunload', handleHostUnload);

      setTarget(null);

      // Defer the close. If StrictMode (or a re-render) re-mounts us within
      // this window, the next effect run will cancel the timer and reuse the
      // existing popup. Otherwise the popup actually closes.
      pendingCloseTimer = setTimeout(() => {
        pendingCloseTimer = null;
        if (activeMounts === 0) {
          closeShared();
        }
      }, 50);
    };
  }, [onClose]);

  if (!target) {
    return null;
  }

  return createPortal(children, target.container);
}

export default PopupPortal;
