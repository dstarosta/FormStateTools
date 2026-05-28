import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act, useState } from 'react';

import type { FormDockSnapshot } from './plugin/transport';

const reportFormState = vi.fn();

vi.mock('./plugin/snapshot-source', () => ({
  reportFormState: (snapshot: FormDockSnapshot) => {
    reportFormState(snapshot);
  },
}));

const { useFormDock } = await import('./use-form-dock');

const makeSnapshot = (valid: boolean | null = true): FormDockSnapshot => ({
  initialState: { data: {}, errors: {} },
  formState: { values: {} },
  formStatus: { valid },
});

describe('useFormDock', () => {
  afterEach(() => {
    reportFormState.mockClear();
  });

  it('reports the snapshot on mount', () => {
    const snapshot = makeSnapshot();

    const Form = () => {
      useFormDock(snapshot);
      return null;
    };

    render(<Form />);

    expect(reportFormState).toHaveBeenCalledTimes(1);
    expect(reportFormState).toHaveBeenCalledWith({
      initialState: snapshot.initialState,
      formState: snapshot.formState,
      formStatus: snapshot.formStatus,
    });
  });

  it('re-reports when the form snapshot fields change', () => {
    const Form = () => {
      const [snapshot, setSnapshot] = useState(() => makeSnapshot(true));

      useFormDock(snapshot);

      return (
        <button
          type="button"
          onClick={() => {
            setSnapshot(makeSnapshot(false));
          }}
        >
          change
        </button>
      );
    };

    render(<Form />);
    expect(reportFormState).toHaveBeenCalledTimes(1);

    act(() => {
      screen.getByRole('button').click();
    });

    expect(reportFormState).toHaveBeenCalledTimes(2);
    expect(reportFormState).toHaveBeenLastCalledWith(
      expect.objectContaining({ formStatus: { valid: false } })
    );
  });

  it('does not re-report when unrelated state changes but the snapshot is stable', () => {
    const stable = makeSnapshot();

    const Form = () => {
      const [count, setCount] = useState(0);

      useFormDock(stable);

      return (
        <button
          type="button"
          onClick={() => {
            setCount((c) => c + 1);
          }}
        >
          {count}
        </button>
      );
    };

    render(<Form />);
    expect(reportFormState).toHaveBeenCalledTimes(1);

    act(() => {
      screen.getByRole('button').click();
    });

    expect(reportFormState).toHaveBeenCalledTimes(1);
  });
});
