import '@testing-library/jest-dom/vitest';

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
  get(): ParentNode | null {
    return (this as Element)?.parentNode ?? null;
  },
});
