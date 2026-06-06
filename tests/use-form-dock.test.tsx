import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { StrictMode, useState } from 'react';

import type { FormDockSnapshot } from '../src/plugin/transport';

const reportFormState = vi.fn();
const clearFormState = vi.fn();

vi.mock('../src/plugin/snapshot-source', () => ({
  reportFormState: (snapshot: FormDockSnapshot) => {
    reportFormState(snapshot);
  },
  clearFormState: () => {
    clearFormState();
  },
}));

const { useFormDock } = await import('../src/use-form-dock');

const makeSnapshot = (valid: boolean | null = true): FormDockSnapshot => ({
  initialState: { data: {}, errors: {} },
  formState: { values: {} },
  formStatus: { valid },
});

const SnapshotForm = ({ snapshot, enabled }: { snapshot: FormDockSnapshot; enabled?: boolean }) => {
  useFormDock(snapshot, enabled);
  return null;
};

const EnableTogglingForm = ({ snapshot }: { snapshot: FormDockSnapshot }) => {
  const [enabled, setEnabled] = useState(true);

  useFormDock(snapshot, enabled);

  return (
    <button
      type="button"
      onClick={() => {
        setEnabled((e) => !e);
      }}
    >
      toggle
    </button>
  );
};

const TogglingForm = () => {
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

describe('useFormDock', () => {
  afterEach(() => {
    reportFormState.mockClear();
    clearFormState.mockClear();
  });

  it('reports the snapshot on mount', () => {
    const snapshot = makeSnapshot();

    render(<SnapshotForm snapshot={snapshot} />);

    expect(reportFormState).toHaveBeenCalledTimes(1);
    expect(reportFormState).toHaveBeenCalledWith({
      initialState: snapshot.initialState,
      formState: snapshot.formState,
      formStatus: snapshot.formStatus,
    });
  });

  it('re-reports when the form snapshot fields change', () => {
    render(<TogglingForm />);
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

  it('does not report when enabled is false', () => {
    render(<SnapshotForm snapshot={makeSnapshot()} enabled={false} />);

    expect(reportFormState).not.toHaveBeenCalled();
    expect(clearFormState).toHaveBeenCalled();
  });

  it('reports when enabled is explicitly true', () => {
    render(<SnapshotForm snapshot={makeSnapshot()} enabled={true} />);

    expect(reportFormState).toHaveBeenCalledTimes(1);
  });

  it('clears then resumes reporting as enabled toggles', () => {
    render(<EnableTogglingForm snapshot={makeSnapshot()} />);
    expect(reportFormState).toHaveBeenCalledTimes(1);

    act(() => {
      screen.getByRole('button').click();
    });

    expect(reportFormState).toHaveBeenCalledTimes(1);
    expect(clearFormState).toHaveBeenCalled();

    act(() => {
      screen.getByRole('button').click();
    });

    expect(reportFormState).toHaveBeenCalledTimes(2);
  });

  it('clears the snapshot on unmount', () => {
    const { unmount } = render(<SnapshotForm snapshot={makeSnapshot()} />);
    const beforeUnmount = clearFormState.mock.calls.length;

    unmount();

    expect(clearFormState.mock.calls.length).toBe(beforeUnmount + 1);
  });

  it('does not clear the snapshot on rerender', () => {
    render(<TogglingForm />);
    const afterMount = clearFormState.mock.calls.length;

    act(() => {
      screen.getByRole('button').click();
    });

    expect(clearFormState.mock.calls.length).toBe(afterMount);
  });

  it('reports the snapshot after StrictMode mount/remount, leaving the dock populated', () => {
    const snapshot = makeSnapshot();

    render(
      <StrictMode>
        <SnapshotForm snapshot={snapshot} />
      </StrictMode>
    );

    const reportCalls = reportFormState.mock.calls.length;
    const clearCalls = clearFormState.mock.calls.length;

    expect(reportCalls).toBeGreaterThanOrEqual(clearCalls);
    expect(reportFormState).toHaveBeenLastCalledWith({
      initialState: snapshot.initialState,
      formState: snapshot.formState,
      formStatus: snapshot.formStatus,
    });
  });
});
