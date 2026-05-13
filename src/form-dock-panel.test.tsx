import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { useFormState, z } from 'form-state';

import FormDockPanel, { type FormDockPanelProps } from './form-dock-panel';
import userEvent from '@testing-library/user-event';

vi.mock('./popup-portal', () => ({
  default: ({ children }: { children: React.ReactNode; onClose: () => void }) => (
    <div data-testid="popup-portal">{children}</div>
  ),
}));

const formSchema = z
  .object({
    id: z.formNumber({ required: true }).with(z.describe('ID')),
    name: z.formString({ required: true }).with(z.describe('Name')),
    age: z.formNumber().with(z.describe('Age')),
  })
  .with(z.describe('Form'));

const defaultProps: Omit<FormDockPanelProps, 'form'> = {
  collapsed: true,
  captureErrors: 'all',
  ignoreErrorPatterns: [],
};

const AppDockPanel = (props: Omit<FormDockPanelProps, 'form'>) => {
  const form = useFormState(formSchema, { initialData: { id: 1, name: 'Mike Johnson', age: 50 } });

  return <FormDockPanel {...props} form={form} />;
};

const AppDockPanelWithErrors = (props: Omit<FormDockPanelProps, 'form'>) => {
  const form = useFormState(formSchema, { validateOnMount: true });

  return <FormDockPanel {...props} form={form} />;
};

const getDetachButton = () =>
  screen.getByRole('button', { name: /^(detach|attach) panel/i, hidden: true });

describe('FormDock', () => {
  describe('Rendering', () => {
    it('renders FormDockPanel in minimized mode', () => {
      render(<AppDockPanel {...defaultProps} />);

      expect(screen.getByText('EXPAND FORM TOOLS')).toBeInTheDocument();
    });

    it('renders FormDockPanel in implicit minimized mode', () => {
      render(<AppDockPanel {...defaultProps} collapsed />);

      expect(screen.getByText('EXPAND FORM TOOLS')).toBeInTheDocument();
    });

    it('renders FormDockPanel in normal mode', () => {
      render(<AppDockPanel {...defaultProps} collapsed={false} />);

      expect(screen.getByText('COLLAPSE FORM TOOLS')).toBeInTheDocument();
    });

    it('renders FormDockPanel in normal mode', async () => {
      render(<AppDockPanel {...defaultProps} collapsed={false} />);

      const user = userEvent.setup();

      const stateNode = screen.getByText('state');
      await user.click(stateNode);

      const dataNode = screen.getByText('data');
      await user.click(dataNode);

      expect(screen.getByText('id')).toBeInTheDocument();
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('age')).toBeInTheDocument();
    });

    it('renders FormDockPanel with errors', async () => {
      render(<AppDockPanelWithErrors {...defaultProps} collapsed={false} />);

      const user = userEvent.setup();

      const stateNode = screen.getByText('state');
      await user.click(stateNode);

      const dataNode = screen.getByText('errors');
      await user.click(dataNode);

      expect(screen.getByText('id')).toBeInTheDocument();
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.queryByText('age')).not.toBeInTheDocument();
    });
  });

  describe('Modes', () => {
    it('switches FormDockPanel to from minimized to normal mode by clicking', async () => {
      render(<AppDockPanel {...defaultProps} />);

      const user = userEvent.setup();

      const panelNode = screen.getByRole('complementary', { hidden: true });
      const headerNode = screen.getByText('EXPAND FORM TOOLS');

      expect(panelNode.style.height).toBe('1.625rem');

      await user.click(headerNode);

      expect(panelNode.style.height).toBe('30vh');
      expect(screen.getByText('COLLAPSE FORM TOOLS')).toBeInTheDocument();
    });

    it('switches FormDockPanel to from normal to minimized mode by clicking', async () => {
      render(<AppDockPanel {...defaultProps} collapsed={false} />);

      const user = userEvent.setup();

      const panelNode = screen.getByRole('complementary', { hidden: true });
      const headerNode = screen.getByText('COLLAPSE FORM TOOLS');

      expect(panelNode.style.height).toBe('30vh');

      await user.click(headerNode);

      expect(panelNode.style.height).toBe('1.625rem');
      expect(screen.getByText('EXPAND FORM TOOLS')).toBeInTheDocument();
    });

    it('switches FormDockPanel to from normal to maximized mode, and back to normal, by right clicking', async () => {
      render(<AppDockPanel {...defaultProps} collapsed={false} />);

      const user = userEvent.setup();

      const panelNode = screen.getByRole('complementary', { hidden: true });
      const headerNode = screen.getByText('COLLAPSE FORM TOOLS');

      expect(panelNode.style.height).toBe('30vh');

      await user.pointer({ keys: '[MouseRight]', target: headerNode });

      expect(panelNode.style.height).toBe('100vh');
      expect(screen.getByText('COLLAPSE FORM TOOLS')).toBeInTheDocument();

      await user.pointer({ keys: '[MouseRight]', target: headerNode });

      expect(panelNode.style.height).toBe('30vh');
      expect(screen.getByText('COLLAPSE FORM TOOLS')).toBeInTheDocument();
    });

    it('switches FormDockPanel to from normal to maximized mode, then to minimized left clicking', async () => {
      render(<AppDockPanel {...defaultProps} collapsed={false} />);

      const user = userEvent.setup();

      const panelNode = screen.getByRole('complementary', { hidden: true });
      const headerNode = screen.getByText('COLLAPSE FORM TOOLS');

      expect(panelNode.style.height).toBe('30vh');

      await user.pointer({ keys: '[MouseRight]', target: headerNode });

      expect(panelNode.style.height).toBe('100vh');
      expect(screen.getByText('COLLAPSE FORM TOOLS')).toBeInTheDocument();

      await user.click(headerNode);

      expect(panelNode.style.height).toBe('30vh');
      expect(screen.getByText('COLLAPSE FORM TOOLS')).toBeInTheDocument();
    });
  });

  describe('Session storage', () => {
    afterEach(() => {
      sessionStorage.removeItem('__form-dock-size');
      sessionStorage.removeItem('__form-dock-detached');
    });

    it('restores a valid stored size, overriding the collapsed prop', () => {
      sessionStorage.setItem('__form-dock-size', 'maximized');

      render(<AppDockPanel {...defaultProps} collapsed />);

      const panelNode = screen.getByRole('complementary', { hidden: true });

      expect(panelNode.style.height).toBe('100vh');
    });

    it('falls back to the collapsed prop when sessionStorage is unavailable', () => {
      vi.stubGlobal('sessionStorage', undefined);

      render(<AppDockPanel {...defaultProps} collapsed={false} />);

      const panelNode = screen.getByRole('complementary', { hidden: true });

      expect(panelNode.style.height).toBe('30vh');

      vi.unstubAllGlobals();
    });

    it('falls back to the collapsed prop when no size is stored', () => {
      render(<AppDockPanel {...defaultProps} collapsed={false} />);

      const panelNode = screen.getByRole('complementary', { hidden: true });

      expect(panelNode.style.height).toBe('30vh');
    });

    it('ignores an invalid stored size and falls back to the collapsed prop', () => {
      sessionStorage.setItem('__form-dock-size', 'unknown-value');

      render(<AppDockPanel {...defaultProps} collapsed />);

      const panelNode = screen.getByRole('complementary', { hidden: true });

      expect(panelNode.style.height).toBe('1.625rem');
    });

    it('restores detached state from sessionStorage', () => {
      sessionStorage.setItem('__form-dock-detached', 'true');

      render(<AppDockPanel {...defaultProps} />);

      expect(screen.getByTestId('popup-portal')).toBeInTheDocument();
      expect(screen.queryByRole('complementary', { hidden: true })).not.toBeInTheDocument();
    });

    it('defaults to attached when no detached value is stored', () => {
      render(<AppDockPanel {...defaultProps} />);

      expect(screen.queryByTestId('popup-portal')).not.toBeInTheDocument();
      expect(screen.getByRole('complementary', { hidden: true })).toBeInTheDocument();
    });

    it('defaults to attached when sessionStorage is unavailable', () => {
      vi.stubGlobal('sessionStorage', undefined);

      render(<AppDockPanel {...defaultProps} />);

      expect(screen.queryByTestId('popup-portal')).not.toBeInTheDocument();
      expect(screen.getByRole('complementary', { hidden: true })).toBeInTheDocument();

      vi.unstubAllGlobals();
    });
  });

  describe('Detach', () => {
    afterEach(() => {
      sessionStorage.removeItem('__form-dock-size');
      sessionStorage.removeItem('__form-dock-detached');
    });

    it('renders the popup portal after clicking the detach button', async () => {
      const user = userEvent.setup();

      render(<AppDockPanel {...defaultProps} collapsed={false} />);

      expect(screen.queryByTestId('popup-portal')).not.toBeInTheDocument();

      await user.click(getDetachButton());

      expect(screen.getByTestId('popup-portal')).toBeInTheDocument();
      expect(screen.queryByRole('complementary', { hidden: true })).not.toBeInTheDocument();
    });

    it('persists the detached state to sessionStorage on detach', async () => {
      const user = userEvent.setup();

      render(<AppDockPanel {...defaultProps} />);

      await user.click(getDetachButton());

      expect(sessionStorage.getItem('__form-dock-detached')).toBe('true');
    });

    it('re-attaches after clicking the attach button in the popup', async () => {
      const user = userEvent.setup();
      sessionStorage.setItem('__form-dock-detached', 'true');

      render(<AppDockPanel {...defaultProps} />);

      expect(screen.getByTestId('popup-portal')).toBeInTheDocument();

      await user.click(getDetachButton());

      expect(screen.queryByTestId('popup-portal')).not.toBeInTheDocument();
      expect(screen.getByRole('complementary', { hidden: true })).toBeInTheDocument();
      expect(sessionStorage.getItem('__form-dock-detached')).toBe('false');
    });

    it('re-attaches when the strip is clicked in the popup', async () => {
      const user = userEvent.setup();
      sessionStorage.setItem('__form-dock-detached', 'true');

      render(<AppDockPanel {...defaultProps} />);

      const stripInPopup = screen.getByText(/form tools detached/i);

      await user.click(stripInPopup);

      expect(screen.queryByTestId('popup-portal')).not.toBeInTheDocument();
      expect(screen.getByRole('complementary', { hidden: true })).toBeInTheDocument();
    });

    it('removes the body margin while detached', async () => {
      const user = userEvent.setup();

      render(<AppDockPanel {...defaultProps} collapsed={false} />);

      expect(document.body.style.marginBottom).toBe('33vh');

      await user.click(getDetachButton());

      expect(document.body.style.marginBottom).toBe('0px');
    });

    it('does not call onClick on the detach button click handler', async () => {
      const user = userEvent.setup();

      render(<AppDockPanel {...defaultProps} collapsed={false} />);

      const panelNode = screen.getByRole('complementary', { hidden: true });

      expect(panelNode.style.height).toBe('30vh');

      await user.click(getDetachButton());

      expect(screen.getByTestId('popup-portal')).toBeInTheDocument();
    });
  });
});
