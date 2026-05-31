import '@testing-library/jest-dom/vitest';

import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

vi.stubEnv('NODE_ENV', 'development');

afterEach(() => {
  sessionStorage.clear();
  cleanup();
});

Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
  get(): ParentNode | null {
    return (this as Element).parentNode ?? null;
  },
});

HTMLElement.prototype.showPopover = () => {};
HTMLElement.prototype.hidePopover = () => {};

// jsdom does not implement the <dialog> methods the error toast relies on.
HTMLDialogElement.prototype.show = function (this: HTMLDialogElement) {
  this.open = true;
};
HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
  this.open = true;
};
HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
  this.open = false;
  this.dispatchEvent(new Event('close'));
};
