import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import FormDockHeader from './form-dock-header';
import * as colors from './colors';

const getStrip = () => screen.getByRole('button', { name: /form tools/i });
const getDetachButton = () => screen.getByRole('button', { name: /^(detach|attach) panel/i });

describe('FormDockHeader', () => {
  const defaultProps = {
    minimized: false,
    detached: false,
    valid: null,
    onClick: vi.fn(),
    onRightClick: vi.fn(),
    onToggleDetach: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with collapse text when not minimized', () => {
      render(<FormDockHeader {...defaultProps} />);

      expect(screen.getByText(/collapse form tools/i)).toBeInTheDocument();
    });

    it('should render with expand text when minimized', () => {
      render(<FormDockHeader {...defaultProps} minimized={true} />);

      expect(screen.getByText(/expand form tools/i)).toBeInTheDocument();
    });

    it('should have correct title when not minimized', () => {
      render(<FormDockHeader {...defaultProps} />);

      expect(getStrip()).toHaveAttribute(
        'title',
        'Click to collapse the form tools panel. Right mouse click maximizes the panel.'
      );
    });

    it('should have correct title when minimized', () => {
      render(<FormDockHeader {...defaultProps} minimized={true} />);

      expect(getStrip()).toHaveAttribute(
        'title',
        'Click to expand the form tools panel. Right mouse click maximizes the panel.'
      );
    });

    it('should render the collapse/expand strip with tabIndex 0', () => {
      render(<FormDockHeader {...defaultProps} />);

      expect(getStrip()).toHaveAttribute('tabIndex', '0');
    });

    it('should render detached label when detached', () => {
      render(<FormDockHeader {...defaultProps} detached={true} />);

      expect(screen.getByText(/form tools detached/i)).toBeInTheDocument();
    });

    it('should set the attach title on the strip when detached', () => {
      render(<FormDockHeader {...defaultProps} detached={true} />);

      expect(getStrip()).toHaveAttribute('title', 'Click to re-attach the form tools panel.');
    });
  });

  describe('Validation Icon', () => {
    it('should hide icon when valid is true', () => {
      render(<FormDockHeader {...defaultProps} valid={true} />);

      const svg = screen
        .getByTitle(/the form has not been validated|the form has errors/i)
        .closest('svg');

      expect(svg).toHaveStyle({ visibility: 'hidden' });
    });

    it('should show icon when valid is false', () => {
      render(<FormDockHeader {...defaultProps} valid={false} />);

      const svg = screen.getByTitle('The form has errors.').closest('svg');

      expect(svg).toHaveStyle({ visibility: 'visible' });
    });

    it('should show icon when valid is null', () => {
      render(<FormDockHeader {...defaultProps} valid={null} />);

      const svg = screen.getByTitle('The form has not been validated.').closest('svg');

      expect(svg).toHaveStyle({ visibility: 'visible' });
    });

    it('should have error color when valid is false', () => {
      render(<FormDockHeader {...defaultProps} valid={false} />);

      const svg = screen.getByTitle('The form has errors.').closest('svg');

      expect(svg).toHaveStyle({ color: colors.PANEL_HEADER_ICON_INVALID_COLOR });
    });

    it('should have warning color when valid is null', () => {
      render(<FormDockHeader {...defaultProps} valid={null} />);

      const svg = screen.getByTitle('The form has not been validated.').closest('svg');

      expect(svg).toHaveStyle({ color: colors.PANEL_HEADER_ICON_UNINITIALIZED_COLOR });
    });

    it('should have correct title when valid is false', () => {
      render(<FormDockHeader {...defaultProps} valid={false} />);

      expect(screen.getByTitle('The form has errors.')).toBeInTheDocument();
    });

    it('should have correct title when valid is null', () => {
      render(<FormDockHeader {...defaultProps} valid={null} />);

      expect(screen.getByTitle('The form has not been validated.')).toBeInTheDocument();
    });
  });

  describe('Mouse Interactions', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<FormDockHeader {...defaultProps} onClick={onClick} />);

      await user.click(getStrip());

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'click',
        })
      );
    });

    it('should call onRightClick when right-clicked', async () => {
      const user = userEvent.setup();
      const onRightClick = vi.fn((e: React.SyntheticEvent) => {
        e.preventDefault();
      });

      render(<FormDockHeader {...defaultProps} onRightClick={onRightClick} />);

      await user.pointer({ keys: '[MouseRight]', target: getStrip() });

      expect(onRightClick).toHaveBeenCalledTimes(1);
      expect(onRightClick).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'contextmenu',
        })
      );
    });

    it('should not call onRightClick when left-clicked', async () => {
      const user = userEvent.setup();
      const onRightClick = vi.fn();

      render(<FormDockHeader {...defaultProps} onRightClick={onRightClick} />);

      await user.click(getStrip());

      expect(onRightClick).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Interactions', () => {
    it('should call onClick when Space key is pressed', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<FormDockHeader {...defaultProps} onClick={onClick} />);

      getStrip().focus();

      await user.keyboard(' ');

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({
          key: ' ',
        })
      );
    });

    it('should call onRightClick when Enter key is pressed', async () => {
      const user = userEvent.setup();
      const onRightClick = vi.fn();

      render(<FormDockHeader {...defaultProps} onRightClick={onRightClick} />);

      getStrip().focus();

      await user.keyboard('{Enter}');

      expect(onRightClick).toHaveBeenCalledTimes(1);
      expect(onRightClick).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'Enter',
        })
      );
    });

    it('should not call onClick when Space is pressed with Alt key', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<FormDockHeader {...defaultProps} onClick={onClick} />);

      getStrip().focus();

      await user.keyboard('{Alt>} {/Alt}');

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when Space is pressed with Ctrl key', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<FormDockHeader {...defaultProps} onClick={onClick} />);

      getStrip().focus();
      await user.keyboard('{Control>} {/Control}');

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when Space is pressed with Shift key', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<FormDockHeader {...defaultProps} onClick={onClick} />);

      getStrip().focus();

      await user.keyboard('{Shift>} {/Shift}');

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should not call onRightClick when Enter is pressed with Alt key', async () => {
      const user = userEvent.setup();
      const onRightClick = vi.fn();

      render(<FormDockHeader {...defaultProps} onRightClick={onRightClick} />);

      getStrip().focus();
      await user.keyboard('{Alt>}{Enter}{/Alt}');

      expect(onRightClick).not.toHaveBeenCalled();
    });

    it('should not call onRightClick when Enter is pressed with Ctrl key', async () => {
      const user = userEvent.setup();
      const onRightClick = vi.fn();

      render(<FormDockHeader {...defaultProps} onRightClick={onRightClick} />);

      getStrip().focus();
      await user.keyboard('{Control>}{Enter}{/Control}');

      expect(onRightClick).not.toHaveBeenCalled();
    });

    it('should not call onRightClick when Enter is pressed with Shift key', async () => {
      const user = userEvent.setup();
      const onRightClick = vi.fn();

      render(<FormDockHeader {...defaultProps} onRightClick={onRightClick} />);

      getStrip().focus();

      await user.keyboard('{Shift>}{Enter}{/Shift}');

      expect(onRightClick).not.toHaveBeenCalled();
    });

    it('should not call any handler when other keys are pressed', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const onRightClick = vi.fn();

      render(<FormDockHeader {...defaultProps} onClick={onClick} onRightClick={onRightClick} />);

      getStrip().focus();

      await user.keyboard('a');
      await user.keyboard('{Escape}');
      await user.keyboard('{Tab}');

      expect(onClick).not.toHaveBeenCalled();
      expect(onRightClick).not.toHaveBeenCalled();
    });
  });

  describe('Focus and Blur', () => {
    it('should add outline on focus', async () => {
      const user = userEvent.setup();
      render(<FormDockHeader {...defaultProps} />);

      const strip = getStrip();
      expect(strip).toHaveStyle({ outline: 'none' });

      // detach button is the first focusable, strip is second
      await user.tab();
      await user.tab();

      expect(strip).toHaveStyle({ outline: `solid 1px ${colors.PANEL_HEADER_OUTLINE_COLOR}` });
    });

    it('should remove outline on blur', async () => {
      const user = userEvent.setup();
      render(
        <>
          <FormDockHeader {...defaultProps} />
          <button>Other button</button>
        </>
      );

      const strip = getStrip();

      // detach button is first, strip is second
      await user.tab();
      await user.tab();
      expect(strip).toHaveStyle({ outline: `solid 1px ${colors.PANEL_HEADER_OUTLINE_COLOR}` });

      await user.tab();
      expect(strip).toHaveStyle({ outline: 'none' });
    });

    it('should be focusable via tab navigation', async () => {
      const user = userEvent.setup();
      render(<FormDockHeader {...defaultProps} />);

      // detach button is first, strip is second
      await user.tab();
      await user.tab();

      expect(getStrip()).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('should have role="button"', () => {
      render(<FormDockHeader {...defaultProps} />);

      expect(getStrip()).toBeInTheDocument();
    });

    it('should be keyboard navigable with tabIndex', () => {
      render(<FormDockHeader {...defaultProps} />);

      expect(getStrip()).toHaveAttribute('tabIndex', '0');
    });

    it('should have descriptive title attribute', () => {
      render(<FormDockHeader {...defaultProps} />);

      const strip = getStrip();

      expect(strip).toHaveAttribute('title');
      expect(strip.getAttribute('title')).toMatch(/Click to (expand|collapse)/);
    });

    it('should have user-select: none on the header strip', () => {
      const { container } = render(<FormDockHeader {...defaultProps} />);

      const outerStrip = container.firstElementChild as HTMLElement;
      expect(outerStrip).toHaveStyle({ userSelect: 'none' });
    });

    it('should have cursor: pointer to indicate interactivity', () => {
      render(<FormDockHeader {...defaultProps} />);

      expect(getStrip()).toHaveStyle({ cursor: 'pointer' });
    });
  });

  describe('Detach button', () => {
    it('should render the detach button with the detach label when attached', () => {
      render(<FormDockHeader {...defaultProps} detached={false} />);

      expect(getDetachButton()).toHaveAttribute(
        'aria-label',
        'Detach panel into a separate window'
      );
    });

    it('should render the detach button with the attach label when detached', () => {
      render(<FormDockHeader {...defaultProps} detached={true} />);

      expect(getDetachButton()).toHaveAttribute('aria-label', 'Attach panel');
    });

    it('should call onToggleDetach when the detach button is clicked', async () => {
      const user = userEvent.setup();
      const onToggleDetach = vi.fn();

      render(<FormDockHeader {...defaultProps} onToggleDetach={onToggleDetach} />);

      await user.click(getDetachButton());

      expect(onToggleDetach).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when the detach button is clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const onToggleDetach = vi.fn();

      render(
        <FormDockHeader {...defaultProps} onClick={onClick} onToggleDetach={onToggleDetach} />
      );

      await user.click(getDetachButton());

      expect(onClick).not.toHaveBeenCalled();
      expect(onToggleDetach).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Integration', () => {
    it('should handle multiple rapid clicks', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<FormDockHeader {...defaultProps} onClick={onClick} />);

      await user.tripleClick(getStrip());

      expect(onClick).toHaveBeenCalledTimes(3);
    });

    it('should maintain state consistency when props change', () => {
      const { rerender } = render(<FormDockHeader {...defaultProps} minimized={false} />);

      expect(screen.getByText(/collapse form tools/i)).toBeInTheDocument();

      rerender(<FormDockHeader {...defaultProps} minimized={true} />);

      expect(screen.getByText(/expand form tools/i)).toBeInTheDocument();

      rerender(<FormDockHeader {...defaultProps} minimized={false} />);

      expect(screen.getByText(/collapse form tools/i)).toBeInTheDocument();
    });

    it('should update validation icon when valid prop changes', () => {
      const { rerender } = render(<FormDockHeader {...defaultProps} valid={null} />);
      let svg = screen.getByTitle('The form has not been validated.').closest('svg');

      expect(svg).toHaveStyle({ visibility: 'visible' });

      rerender(<FormDockHeader {...defaultProps} valid={false} />);

      svg = screen.getByTitle('The form has errors.').closest('svg');

      expect(svg).toHaveStyle({ visibility: 'visible' });

      rerender(<FormDockHeader {...defaultProps} valid={true} />);

      const validitySvg = screen
        .getByTitle(/the form has not been validated|the form has errors/i)
        .closest('svg');
      expect(validitySvg).toHaveStyle({ visibility: 'hidden' });
    });

    it('should work with different callback functions', async () => {
      const user = userEvent.setup();
      const firstOnClick = vi.fn();
      const secondOnClick = vi.fn();

      const { rerender } = render(<FormDockHeader {...defaultProps} onClick={firstOnClick} />);

      await user.click(getStrip());

      expect(firstOnClick).toHaveBeenCalledTimes(1);
      expect(secondOnClick).not.toHaveBeenCalled();

      rerender(<FormDockHeader {...defaultProps} onClick={secondOnClick} />);

      await user.click(getStrip());

      expect(firstOnClick).toHaveBeenCalledTimes(1);
      expect(secondOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle onClick and onRightClick being the same function', async () => {
      const user = userEvent.setup();
      const handler = vi.fn((e: React.SyntheticEvent) => {
        e.preventDefault();
      });

      render(<FormDockHeader {...defaultProps} onClick={handler} onRightClick={handler} />);

      const strip = getStrip();

      await user.click(strip);
      await user.pointer({ keys: '[MouseRight]', target: strip });

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should handle event propagation correctly', async () => {
      const user = userEvent.setup();
      const parentClick = vi.fn();
      const childClick = vi.fn();

      render(
        <a href="#" onClick={parentClick}>
          <FormDockHeader {...defaultProps} onClick={childClick} />
        </a>
      );

      await user.click(getStrip());

      expect(childClick).toHaveBeenCalledTimes(1);
      expect(parentClick).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard events when already focused', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      const onRightClick = vi.fn();

      render(<FormDockHeader {...defaultProps} onClick={onClick} onRightClick={onRightClick} />);

      getStrip().focus();

      await user.keyboard(' ');
      await user.keyboard('{Enter}');

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onRightClick).toHaveBeenCalledTimes(1);
    });
  });
});
