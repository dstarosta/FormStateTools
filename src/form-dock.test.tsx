import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';

import { useFormState, z } from 'form-state';

import FormDock, { type FormDockProps } from './form-dock';

const formSchema = z.object({
  id: z.formNumber({ required: true }),
  name: z.formString({ required: true }),
  age: z.formNumber(),
});

const AppForm = (props: Omit<FormDockProps, 'form'>) => {
  const form = useFormState(formSchema);

  return <FormDock {...props} form={form} />;
};

describe('FormDock', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
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
});
