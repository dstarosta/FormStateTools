import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

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

    const { getByText } = render(<AppForm />);

    expect(getByText('EXPAND FORM TOOLS')).toBeInTheDocument();
  });

  it('does not render FormDock in production mode', () => {
    vi.stubEnv('NODE_ENV', 'production');

    const { queryByText } = render(<AppForm />);

    expect(queryByText('EXPAND FORM TOOLS')).not.toBeInTheDocument();
  });

  it('does not render FormDock in unspecified mode', () => {
    const { queryByText } = render(<AppForm />);

    expect(queryByText('EXPAND FORM TOOLS')).not.toBeInTheDocument();
  });

  it('does renders FormDock in implicit dev mode', () => {
    const { getByText } = render(<AppForm devMode />);

    expect(getByText('EXPAND FORM TOOLS')).toBeInTheDocument();
  });

  it('does not render FormDock in implicit non-dev mode', () => {
    const { queryByText } = render(<AppForm devMode={false} />);

    expect(queryByText('EXPAND FORM TOOLS')).not.toBeInTheDocument();
  });
});
