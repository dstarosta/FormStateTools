import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { renderToString } from 'react-dom/server';

import { useFormState, z } from 'form-state';

import FormDock, { type FormDockProps } from './form-dock';
import { clearFormState, reportFormState } from './plugin/snapshot-source';
import type { FormDockSnapshot } from './plugin/transport';

const formSchema = z.object({
  id: z.formNumber({ required: true }),
  name: z.formString({ required: true }),
  age: z.formNumber(),
});

const AppForm = (props: Omit<FormDockProps, 'form'>) => {
  const form = useFormState(formSchema);

  return <FormDock {...props} form={form} />;
};

const makeSnapshot = (valid: boolean | null = true): FormDockSnapshot => ({
  initialState: { data: { name: '' }, errors: {} },
  formState: { values: { name: 'a' } },
  formStatus: { valid },
});

describe('FormDock', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    act(() => {
      clearFormState();
    });
  });

  it('renders FormDock in development mode', () => {
    vi.stubEnv('NODE_ENV', 'development');

    render(<AppForm />);

    expect(screen.getByText('EXPAND FORM TOOLS')).toBeInTheDocument();
  });

  it('does not render FormDock in production mode', () => {
    vi.stubEnv('NODE_ENV', 'production');

    render(<AppForm />);

    expect(screen.queryByText('EXPAND FORM TOOLS')).not.toBeInTheDocument();
  });

  it('does not render FormDock in unspecified mode', () => {
    render(<AppForm />);

    expect(screen.queryByText('EXPAND FORM TOOLS')).not.toBeInTheDocument();
  });

  it('does renders FormDock in implicit dev mode', () => {
    render(<AppForm devMode />);

    expect(screen.getByText('EXPAND FORM TOOLS')).toBeInTheDocument();
  });

  it('does not render FormDock in implicit non-dev mode', () => {
    render(<AppForm devMode={false} />);

    expect(screen.queryByText('EXPAND FORM TOOLS')).not.toBeInTheDocument();
  });

  it('renders nothing during SSR even in dev mode (isMounted gate)', () => {
    vi.stubEnv('NODE_ENV', 'development');

    const html = renderToString(<AppForm devMode />);

    expect(html).not.toContain('EXPAND FORM TOOLS');
  });

  describe('transport mode (no form prop)', () => {
    it('renders the dock once a snapshot is reported', () => {
      render(<FormDock devMode captureErrors="none" />);

      act(() => {
        reportFormState(makeSnapshot());
      });

      expect(screen.getByText('EXPAND FORM TOOLS')).toBeInTheDocument();
    });

    it('reflects the reported snapshot validity in the header indicator', () => {
      render(<FormDock devMode collapsed={false} captureErrors="none" />);

      act(() => {
        reportFormState(makeSnapshot(false));
      });

      expect(screen.getByTitle('The form has errors.')).toBeInTheDocument();
    });

    it('does not render in production mode even when a snapshot is reported', () => {
      vi.stubEnv('NODE_ENV', 'production');

      render(<FormDock captureErrors="none" />);

      act(() => {
        reportFormState(makeSnapshot());
      });

      expect(screen.queryByText('EXPAND FORM TOOLS')).not.toBeInTheDocument();
    });

    it('captures errors before any snapshot is reported', async () => {
      render(<FormDock devMode captureErrors="all" />);

      expect(screen.queryByText('EXPAND FORM TOOLS')).not.toBeInTheDocument();

      console.error('boom before any form');

      await waitFor(() => {
        expect(screen.getByText(/boom before any form/)).toBeInTheDocument();
      });
    });

    it('does not mount the error toast when captureErrors is "none"', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<FormDock devMode captureErrors="none" />);

      expect(console.error).toBe(errorSpy);

      errorSpy.mockRestore();
    });

    it('prefers the form prop over the transport snapshot', () => {
      const AppFormValid = () => {
        const form = useFormState(formSchema);
        return <FormDock devMode collapsed={false} captureErrors="none" form={form} />;
      };

      render(<AppFormValid />);

      act(() => {
        reportFormState(makeSnapshot(false));
      });

      expect(screen.queryByTitle('The form has errors.')).not.toBeInTheDocument();
    });
  });
});
