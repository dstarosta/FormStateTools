import { describe, it, expect, afterAll, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as colors from './colors';

const errorEventHandler = (event: ErrorEvent) => {
  event.preventDefault();
};

describe('ErrorToast', async () => {
  const originalConsoleError = console.error;
  console.error = vi.fn();

  globalThis.addEventListener('error', errorEventHandler);

  const { default: ErrorToast } = await import('./error-toast');

  beforeEach(() => {
    HTMLDialogElement.prototype.show = vi.fn(function (this: HTMLDialogElement) {
      this.open = true;
    });
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    });
  });

  afterAll(() => {
    globalThis.removeEventListener('error', errorEventHandler);

    console.error = originalConsoleError;
  });

  describe('formatValue helper', () => {
    it('should format console error with prefix', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('test error');

      await waitFor(() => {
        expect(screen.getByText(/ConsoleError: test error/)).toBeInTheDocument();
      });
    });

    it('should format function values', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error(() => {});

      await waitFor(() => {
        expect(screen.getByText(/ConsoleError: \[function]/)).toBeInTheDocument();
      });
    });

    it('should format Promise values', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      const promise = Promise.resolve();
      console.error(promise);

      await waitFor(() => {
        expect(screen.getByText(/ConsoleError: \[Promise]/)).toBeInTheDocument();
      });
    });

    it('should format Error objects', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      const error = new Error('test error message');
      console.error(error);

      await waitFor(() => {
        expect(screen.getByText(/Error: test error message/)).toBeInTheDocument();
      });
    });

    it('should format strings', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      const error = '  test error message\n ';
      console.error(error);

      await waitFor(() => {
        expect(screen.getByText(/ConsoleError: test error message/)).toBeInTheDocument();
      });
    });

    it('should format templated strings', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      const error = '`  test error\n   message  `';
      console.error(error);

      await waitFor(() => {
        expect(screen.getByText(/ConsoleError: test error message/)).toBeInTheDocument();
      });
    });

    it('should format plain objects as JSON', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      const obj = { message: 'error', code: 123 };
      console.error(obj);

      await waitFor(() => {
        expect(screen.getByText(/"message": "error"/)).toBeInTheDocument();
      });
    });

    it('should format non-serializable objects with toString', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      const circular: Record<string, unknown> = {};
      circular['self'] = circular;

      console.error(circular);

      await waitFor(() => {
        expect(screen.getByText(/\[object Object]/)).toBeInTheDocument();
      });
    });

    it('should format primitive values as strings', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error(123);

      await waitFor(() => {
        expect(screen.getByText(/ConsoleError: 123/)).toBeInTheDocument();
      });
    });

    it('should format thrown errors without console prefix', async () => {
      render(<ErrorToast captureErrors="thrown" ignoreErrorPatterns={[]} />);

      const error = new Error('thrown error');

      globalThis.dispatchEvent(new ErrorEvent('error', { error }));

      await waitFor(() => {
        const text = screen.getByText(/Error: thrown error/);
        expect(text.textContent).not.toMatch(/^ConsoleError:/);
      });
    });
  });

  describe('isEmptyError helper', () => {
    it('should filter out undefined errors', () => {
      const { container } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error();

      const dialog = container.querySelector('dialog');
      expect(dialog?.open).toBe(false);
    });

    it('should filter out null errors', () => {
      const { container } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error(null);

      const dialog = container.querySelector('dialog');
      expect(dialog?.open).toBe(false);
    });

    it('should filter out empty string errors', () => {
      const { container } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('   ');

      const dialog = container.querySelector('dialog');
      expect(dialog?.open).toBe(false);
    });

    it('should filter out empty array errors', () => {
      const { container } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error([]);

      const dialog = container.querySelector('dialog');
      expect(dialog?.open).toBe(false);
    });

    it('should not filter non-empty errors', async () => {
      const { container } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('actual error');

      await waitFor(() => {
        const dialog = container.querySelector('dialog');
        expect(dialog?.open).toBe(true);
      });
    });
  });

  describe('isIgnoredError helper', () => {
    it('should ignore errors matching RegExp pattern', () => {
      const { container } = render(
        <ErrorToast captureErrors="console" ignoreErrorPatterns={[/test.*error/]} />
      );

      console.error('test some error');

      const dialog = container.querySelector('dialog');
      expect(dialog?.open).toBe(false);
    });

    it('should ignore errors matching string pattern', () => {
      const { container } = render(
        <ErrorToast captureErrors="console" ignoreErrorPatterns={['ignore this']} />
      );

      console.error('ignore this');

      const dialog = container.querySelector('dialog');
      expect(dialog?.open).toBe(false);
    });

    it('should not ignore errors not matching patterns', async () => {
      const { container } = render(
        <ErrorToast captureErrors="console" ignoreErrorPatterns={[/test/, 'ignore']} />
      );

      console.error('actual error');

      await waitFor(() => {
        const dialog = container.querySelector('dialog');
        expect(dialog?.open).toBe(true);
      });
    });

    it('should handle multiple ignore patterns', () => {
      const { container } = render(
        <ErrorToast
          captureErrors="console"
          ignoreErrorPatterns={[/pattern1/, /pattern2/, 'exact match']}
        />
      );

      console.error('this has pattern1 in it');
      expect(container.querySelector('dialog')?.open).toBe(false);

      console.error('pattern2 is here');
      expect(container.querySelector('dialog')?.open).toBe(false);

      console.error('exact match');
      expect(container.querySelector('dialog')?.open).toBe(false);
    });

    it('should update ignored patterns dynamically', async () => {
      const { container, rerender } = render(
        <ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />
      );

      console.error('should show');

      await waitFor(() => {
        expect(container.querySelector('dialog')?.open).toBe(true);
      });

      rerender(<ErrorToast captureErrors="console" ignoreErrorPatterns={[/should show/]} />);

      expect(container.querySelector('dialog')?.open).toBe(true);
    });
  });

  describe('captureErrors prop', () => {
    it('should capture console errors when captureErrors is "console"', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('console error');

      await waitFor(() => {
        expect(screen.getByText(/console error/)).toBeInTheDocument();
      });
    });

    it('should capture thrown errors when captureErrors is "thrown"', async () => {
      render(<ErrorToast captureErrors="thrown" ignoreErrorPatterns={[]} />);

      const error = new Error('thrown error');

      globalThis.dispatchEvent(new ErrorEvent('error', { error }));

      await waitFor(() => {
        expect(screen.getByText(/thrown error/)).toBeInTheDocument();
      });
    });

    it('should capture both console and thrown errors when captureErrors is "all"', async () => {
      render(<ErrorToast captureErrors="all" ignoreErrorPatterns={[]} />);

      console.error('console error');

      await waitFor(() => {
        expect(screen.getByText(/console error/)).toBeInTheDocument();
      });

      const error = new Error('thrown error');

      globalThis.dispatchEvent(new ErrorEvent('error', { error }));

      await waitFor(() => {
        expect(screen.getByText(/thrown error/)).toBeInTheDocument();
      });
    });

    it('should not capture console errors when captureErrors is "thrown"', () => {
      const { container } = render(<ErrorToast captureErrors="thrown" ignoreErrorPatterns={[]} />);

      console.error('console error');

      const dialog = container.querySelector('dialog');
      expect(dialog?.open).toBe(false);
    });

    it('should not capture thrown errors when captureErrors is "console"', () => {
      const { container } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      const error = new Error('thrown error');
      globalThis.dispatchEvent(new ErrorEvent('error', { error }));

      const dialog = container.querySelector('dialog');
      expect(dialog?.open).toBe(false);
    });

    it('should handle captureErrors value of "none" type', () => {
      const { container } = render(<ErrorToast captureErrors="none" ignoreErrorPatterns={[]} />);

      console.error('should not capture');
      const error = new Error('should not capture');

      globalThis.dispatchEvent(new ErrorEvent('error', { error }));

      const dialog = container.querySelector('dialog');
      expect(dialog?.open).toBe(false);
    });
  });

  describe('dialog functionality', () => {
    it('should render dialog element', () => {
      const { container } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      const dialog = container.querySelector('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should show dialog when error occurs', async () => {
      const { container } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('test error');

      await waitFor(() => {
        const dialog = container.querySelector('dialog');
        expect(dialog?.open).toBe(true);
      });
    });

    it('should close dialog when close button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('test error');

      await waitFor(() => {
        const dialog = container.querySelector('dialog');
        expect(dialog?.open).toBe(true);
      });

      const closeButton = screen.getByTitle('Hide error');
      await user.click(closeButton);

      await waitFor(() => {
        const dialog = container.querySelector('dialog');
        expect(dialog?.open).toBe(false);
      });
    });

    it('should have correct closedby attribute', () => {
      const { container } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      const dialog = container.querySelector('dialog');
      expect(dialog?.getAttribute('closedby')).toBe('closerequest');
    });

    it('should display error count in heading', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('error');

      await waitFor(() => {
        expect(screen.getByText(/MOST RECENT/)).toBeInTheDocument();
        expect(screen.getByText(/ERROR/)).toBeInTheDocument();
      });
    });

    it('should show CONSOLE in heading for console errors', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('console error');

      await waitFor(() => {
        expect(screen.getByText(/MOST RECENT CONSOLE ERROR/)).toBeInTheDocument();
      });
    });

    it('should not show CONSOLE in heading for thrown errors', async () => {
      render(<ErrorToast captureErrors="thrown" ignoreErrorPatterns={[]} />);

      const error = new Error('thrown error');

      globalThis.dispatchEvent(new ErrorEvent('error', { error }));

      await waitFor(() => {
        const heading = screen.getByText(/MOST RECENT ERROR/);
        expect(heading.textContent).not.toContain('CONSOLE');
      });
    });
  });

  describe('error display', () => {
    it('should display single error', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('single error');

      await waitFor(() => {
        expect(screen.getByText(/single error/)).toBeInTheDocument();
      });
    });

    it('should display multiple errors from same console.error call', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('error 1', 'error 2', 'error 3');

      await waitFor(() => {
        expect(screen.getByText(/error 1/)).toBeInTheDocument();
        expect(screen.getByText(/error 2/)).toBeInTheDocument();
        expect(screen.getByText(/error 3/)).toBeInTheDocument();
      });
    });

    it('should replace previous errors with new ones', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('first error');

      await waitFor(() => {
        expect(screen.getByText(/first error/)).toBeInTheDocument();
      });

      console.error('second error');

      await waitFor(() => {
        expect(screen.getByText(/second error/)).toBeInTheDocument();
        expect(screen.queryByText(/first error/)).not.toBeInTheDocument();
      });
    });

    it('should use wrap whitespace for non-object/array errors', async () => {
      const { container } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('simple string error');

      await waitFor(() => {
        const pre = container.querySelector('pre');
        expect(pre?.style.whiteSpace).toBe('wrap');
      });
    });

    it('should use default whitespace for object errors', async () => {
      const { container } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error({ key: 'value' });

      await waitFor(() => {
        const pre = container.querySelector('pre');
        expect(pre?.style.whiteSpace).toBe('');
      });
    });

    it('should use default whitespace for array errors', async () => {
      const { container } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error(['item1', 'item2']);

      await waitFor(() => {
        const pre = container.querySelector('pre');
        expect(pre?.style.whiteSpace).toBe('');
      });
    });

    it('should filter empty errors from display', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('valid error', null, undefined, '   ', []);

      await waitFor(() => {
        expect(screen.getByText(/valid error/)).toBeInTheDocument();

        const pres = screen.getAllByRole('generic').filter((el) => el.tagName === 'PRE');
        expect(pres).toHaveLength(1);
      });
    });
  });

  describe('close button interactions', () => {
    it('should apply focus outline on focus', async () => {
      const user = userEvent.setup();
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('test error');

      await waitFor(() => {
        expect(screen.getByTitle('Hide error')).toBeInTheDocument();
      });

      const button = screen.getByTitle('Hide error');
      await user.tab();

      expect(button).toHaveFocus();
      expect(button.style.outline).toContain('solid');
    });

    it('should remove outline on blur', async () => {
      const user = userEvent.setup();
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('test error');

      await waitFor(() => {
        expect(screen.getByTitle('Hide error')).toBeInTheDocument();
      });

      const button = screen.getByTitle('Hide error');
      await user.tab();

      expect(button).toHaveFocus();

      await user.tab();
      expect(button.style.outline).toBe('none');
    });

    it('should change color on mouse enter', async () => {
      const user = userEvent.setup();
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('test error');

      await waitFor(() => {
        expect(screen.getByTitle('Hide error')).toBeInTheDocument();
      });

      const button = screen.getByTitle('Hide error');
      await user.hover(button);

      expect(button.style.color).toBe(colors.TOAST_HEADER_COLOR);
    });

    it('should reset color on mouse leave', async () => {
      const user = userEvent.setup();
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('test error');

      await waitFor(() => {
        expect(screen.getByTitle('Hide error')).toBeInTheDocument();
      });

      const button = screen.getByTitle('Hide error');
      await user.hover(button);
      await user.unhover(button);

      expect(button.style.color).toBe(colors.TOAST_COLOR);
    });

    it('should have correct tabIndex', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('test error');

      await waitFor(() => {
        const button = screen.getByTitle('Hide error');
        expect(button.tabIndex).toBe(0);
      });
    });

    it('should render SVG icon', async () => {
      const { container } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('test error');

      await waitFor(() => {
        const svg = container.querySelector('svg');

        expect(svg).toBeInTheDocument();
        expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
      });
    });
  });

  describe('cleanup and memory management', () => {
    it('should restore original console.error on unmount', () => {
      const currentConsoleError = console.error;
      console.error = vi.fn();

      const { unmount } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      expect(console.error).not.toBe(currentConsoleError);

      unmount();

      expect(console.error).toBe(currentConsoleError);
    });

    it('should remove error event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(globalThis, 'removeEventListener');

      const { unmount } = render(<ErrorToast captureErrors="thrown" ignoreErrorPatterns={[]} />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('should remove dialog close listener on unmount', () => {
      const { container, unmount } = render(
        <ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />
      );

      const dialog = container.querySelector('dialog');
      const removeEventListenerSpy = vi.spyOn(dialog as HTMLDialogElement, 'removeEventListener');

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('close', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('should handle cleanup when dialog ref is null', () => {
      const { unmount } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('effect dependencies and updates', () => {
    it('should update handlers when ignoreErrorPatterns changes', async () => {
      const { rerender } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('test error');

      await waitFor(() => {
        expect(screen.getByText(/test error/)).toBeInTheDocument();
      });

      rerender(<ErrorToast captureErrors="console" ignoreErrorPatterns={[/test/]} />);

      const closeButton = screen.getByTitle('Hide error');
      await userEvent.click(closeButton);

      console.error('test error 2');

      await waitFor(() => {
        expect(screen.queryByText(/test error 2/)).not.toBeInTheDocument();
      });
    });

    it('should update capture mode when captureErrors changes', async () => {
      const { rerender } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('console error');

      await waitFor(() => {
        expect(screen.getByText(/console error/)).toBeInTheDocument();
      });

      rerender(<ErrorToast captureErrors="thrown" ignoreErrorPatterns={[]} />);

      const closeButton = screen.getByTitle('Hide error');
      await userEvent.click(closeButton);

      console.error('new console error');

      await waitFor(() => {
        expect(screen.queryByText(/new console error/)).not.toBeInTheDocument();
      });
    });
  });

  describe('dialog open/close logic', () => {
    it('should not open dialog if already open', async () => {
      const { container } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('error 1');

      await waitFor(() => {
        const dialog = container.querySelector('dialog');
        expect(dialog?.open).toBe(true);
      });

      console.error('error 2');

      await waitFor(() => {
        const dialog = container.querySelector('dialog');
        expect(dialog?.open).toBe(true);
      });
    });

    it('should close dialog when errors array becomes empty', async () => {
      const user = userEvent.setup();
      const { container } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('test error');

      await waitFor(() => {
        const dialog = container.querySelector('dialog');
        expect(dialog?.open).toBe(true);
      });

      const closeButton = screen.getByTitle('Hide error');
      await user.click(closeButton);

      await waitFor(() => {
        const dialog = container.querySelector('dialog');
        expect(dialog?.open).toBe(false);
      });
    });

    it('should handle dialog ref being null', () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      expect(() => {
        console.error('test');
      }).not.toThrow();
    });
  });

  describe('edge cases and error types', () => {
    it('should handle boolean errors', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error(true);

      await waitFor(() => {
        expect(screen.getByText(/ConsoleError: true/)).toBeInTheDocument();
      });
    });

    it('should handle number errors', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error(0);

      await waitFor(() => {
        expect(screen.getByText(/ConsoleError: 0/)).toBeInTheDocument();
      });
    });

    it('should handle BigInt errors', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error(123n);

      await waitFor(() => {
        expect(screen.getByText(/123/)).toBeInTheDocument();
      });
    });

    it('should handle Symbol errors', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error(Symbol('test'));

      await waitFor(() => {
        expect(screen.getByText(/Symbol\(test\)/)).toBeInTheDocument();
      });
    });

    it('should handle nested objects', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      const nested = {
        level1: {
          level2: {
            message: 'deep error',
          },
        },
      };
      console.error(nested);

      await waitFor(() => {
        expect(screen.getByText(/deep error/)).toBeInTheDocument();
      });
    });

    it('should handle arrays with mixed types', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error([1, 'string', { key: 'value' }, null]);

      await waitFor(() => {
        expect(screen.getByText(/string/)).toBeInTheDocument();
      });
    });

    it('should handle Error with custom properties', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      const error = new Error('base message');
      (error as Error & { code: number }).code = 500;
      console.error(error);

      await waitFor(() => {
        expect(screen.getByText(/base message/)).toBeInTheDocument();
      });
    });

    it('should handle TypeError', async () => {
      render(<ErrorToast captureErrors="thrown" ignoreErrorPatterns={[]} />);

      const error = new TypeError('Type error occurred');

      globalThis.dispatchEvent(new ErrorEvent('error', { error }));

      await waitFor(() => {
        expect(screen.getByText(/TypeError: Type error occurred/)).toBeInTheDocument();
      });
    });

    it('should handle custom Error subclasses', async () => {
      render(<ErrorToast captureErrors="thrown" ignoreErrorPatterns={[]} />);

      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom error occurred');

      globalThis.dispatchEvent(new ErrorEvent('error', { error }));

      await waitFor(() => {
        expect(screen.getByText(/CustomError: Custom error occurred/)).toBeInTheDocument();
      });
    });
  });

  describe('pattern matching edge cases', () => {
    it('should match patterns in formatted error strings', () => {
      const { container } = render(
        <ErrorToast captureErrors="console" ignoreErrorPatterns={[/ConsoleError:/]} />
      );

      console.error('any message');

      const dialog = container.querySelector('dialog');

      expect(dialog?.open).toBe(false);
    });

    it('should handle case-sensitive string patterns', async () => {
      const { container } = render(
        <ErrorToast captureErrors="console" ignoreErrorPatterns={['ERROR']} />
      );

      console.error('error');

      await waitFor(() => {
        const dialog = container.querySelector('dialog');
        expect(dialog?.open).toBe(true);
      });
    });

    it('should handle RegExp with flags', () => {
      const { container } = render(
        <ErrorToast captureErrors="console" ignoreErrorPatterns={[/error/i]} />
      );

      console.error('error in lowercase');

      const dialog = container.querySelector('dialog');

      expect(dialog?.open).toBe(false);
    });

    it('should handle empty pattern array', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('should show');

      await waitFor(() => {
        expect(screen.getByText(/should show/)).toBeInTheDocument();
      });
    });
  });

  describe('styling and presentation', () => {
    it('should have correct dialog positioning styles', () => {
      const { container } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      const dialog = container.querySelector('dialog') as HTMLDialogElement;

      expect(dialog.style.position).toBe('fixed');
      expect(dialog.style.top).toBe('0.5rem');
      expect(dialog.style.right).toBe('0.5rem');
      expect(dialog.style.zIndex).toBe('1000');
    });

    it('should apply correct error formatting styles', async () => {
      const { container } = render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('test error');

      await waitFor(() => {
        const pre = container.querySelector('pre');

        expect(pre?.style.fontWeight).toBe('600');
        expect(pre?.style.marginTop).toBe('10px');
        expect(pre?.style.wordBreak).toBe('break-word');
      });
    });

    it('should render with correct heading styles', async () => {
      render(<ErrorToast captureErrors="console" ignoreErrorPatterns={[]} />);

      console.error('test');

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 3 });
        expect(heading).toHaveStyle({ fontSize: '14px', fontWeight: '600' });
      });
    });
  });
});
