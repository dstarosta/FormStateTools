import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { useFormState, z } from 'form-state';

import FormDockPanel, { type FormDockPanelProps } from './form-dock-panel';
import userEvent from '@testing-library/user-event';

const formSchema = z.object({
  id: z.formNumber({ required: true }),
  name: z.formString({ required: true }),
  age: z.formNumber(),
});

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

      expect(panelNode.style.height).toBe('1.125rem');

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

      expect(panelNode.style.height).toBe('1.125rem');
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
});
