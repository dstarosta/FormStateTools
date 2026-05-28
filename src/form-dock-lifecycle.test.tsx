import { describe, expect, it } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { StrictMode, useState } from 'react';

import FormDock from './form-dock';
import { useFormDock } from './use-form-dock';
import type { FormDockSnapshot } from './plugin/transport';

const makeSnapshot = (valid: boolean | null = true): FormDockSnapshot => ({
  initialState: { data: { name: '' }, errors: {} },
  formState: { values: { name: 'a' } },
  formStatus: { valid },
});

const Harness = ({ showForm }: { showForm: boolean }) => (
  <>
    {showForm && <ReportingForm />}
    <FormDock />
  </>
);

const ReportingForm = () => {
  useFormDock(makeSnapshot());
  return null;
};

const dockPresent = () =>
  screen.queryByRole('button', { name: /^(detach|attach) panel/i, hidden: true }) !== null;

describe('FormDock lifecycle', () => {
  it('renders the dock while a form reports and removes it once the form unmounts', () => {
    const { rerender } = render(<Harness showForm />);

    expect(dockPresent()).toBe(true);

    act(() => {
      rerender(<Harness showForm={false} />);
    });

    expect(dockPresent()).toBe(false);
  });

  it('keeps the dock populated through a StrictMode mount/remount cycle', () => {
    render(
      <StrictMode>
        <Harness showForm />
      </StrictMode>
    );

    expect(dockPresent()).toBe(true);
  });

  it('removes the dock on a real unmount even under StrictMode', () => {
    const Toggle = () => {
      const [showForm, setShowForm] = useState(true);
      return (
        <>
          <Harness showForm={showForm} />
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
            }}
          >
            hide
          </button>
        </>
      );
    };

    render(
      <StrictMode>
        <Toggle />
      </StrictMode>
    );

    expect(dockPresent()).toBe(true);

    act(() => {
      screen.getByRole('button', { name: 'hide' }).click();
    });

    expect(dockPresent()).toBe(false);
  });
});
