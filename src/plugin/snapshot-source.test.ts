import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FORM_DOCK_EVENT, type FormDockSnapshot } from './transport';
import type { ViteHot } from './vite-hot';

const makeSnapshot = (valid: boolean | null = true): FormDockSnapshot => ({
  initialState: { data: { name: '' }, errors: {} },
  formState: { values: { name: 'a' } },
  formStatus: { valid },
});

// Mockable seam: the store reads the Vite HMR client through getHot().
const getHot = vi.fn<() => ViteHot | undefined>();

vi.mock('./vite-hot', () => ({
  getHot: () => getHot(),
}));

// The store holds singleton state, so re-import it fresh per test.
const importFresh = async () => {
  vi.resetModules();
  return import('./snapshot-source');
};

type MockHot = {
  on: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
};

const makeHot = (): MockHot => ({ on: vi.fn(), send: vi.fn() });

describe('snapshot-source', () => {
  beforeEach(() => {
    getHot.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSnapshot / reportFormState', () => {
    it('starts with no snapshot', async () => {
      const { getSnapshot } = await importFresh();

      expect(getSnapshot()).toBeUndefined();
    });

    it('stores the snapshot reported via reportFormState', async () => {
      const { reportFormState, getSnapshot } = await importFresh();
      const snapshot = makeSnapshot();

      reportFormState(snapshot);

      expect(getSnapshot()).toBe(snapshot);
    });

    it('overwrites the previous snapshot', async () => {
      const { reportFormState, getSnapshot } = await importFresh();

      reportFormState(makeSnapshot(true));
      const second = makeSnapshot(false);
      reportFormState(second);

      expect(getSnapshot()).toBe(second);
    });
  });

  describe('clearFormState', () => {
    it('resets the snapshot to undefined', async () => {
      const { reportFormState, clearFormState, getSnapshot } = await importFresh();

      reportFormState(makeSnapshot());
      clearFormState();

      expect(getSnapshot()).toBeUndefined();
    });

    it('notifies subscribers when cleared', async () => {
      const { subscribeToSnapshots, clearFormState } = await importFresh();
      const listener = vi.fn();

      subscribeToSnapshots(listener);
      clearFormState();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('relays the cleared state over the transport', async () => {
      const hot = makeHot();
      getHot.mockReturnValue(hot as unknown as ViteHot);
      const { clearFormState } = await importFresh();

      clearFormState();

      expect(hot.send).toHaveBeenCalledWith(FORM_DOCK_EVENT, undefined);
    });

    it('does not throw without a transport', async () => {
      const { clearFormState } = await importFresh();

      expect(() => {
        clearFormState();
      }).not.toThrow();
    });
  });

  describe('getServerSnapshot', () => {
    it('always returns undefined', async () => {
      const { getServerSnapshot, reportFormState } = await importFresh();

      reportFormState(makeSnapshot());

      expect(getServerSnapshot()).toBeUndefined();
    });
  });

  describe('subscribeToSnapshots', () => {
    it('notifies subscribers when a snapshot is reported', async () => {
      const { subscribeToSnapshots, reportFormState } = await importFresh();
      const listener = vi.fn();

      subscribeToSnapshots(listener);
      reportFormState(makeSnapshot());

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('notifies multiple subscribers', async () => {
      const { subscribeToSnapshots, reportFormState } = await importFresh();
      const a = vi.fn();
      const b = vi.fn();

      subscribeToSnapshots(a);
      subscribeToSnapshots(b);
      reportFormState(makeSnapshot());

      expect(a).toHaveBeenCalledTimes(1);
      expect(b).toHaveBeenCalledTimes(1);
    });

    it('stops notifying after unsubscribe', async () => {
      const { subscribeToSnapshots, reportFormState } = await importFresh();
      const listener = vi.fn();

      const unsubscribe = subscribeToSnapshots(listener);
      unsubscribe();
      reportFormState(makeSnapshot());

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('transport wiring (hot client present)', () => {
    it('registers a hot listener for the snapshot event on subscribe', async () => {
      const hot = makeHot();
      getHot.mockReturnValue(hot as unknown as ViteHot);
      const { subscribeToSnapshots } = await importFresh();

      subscribeToSnapshots(vi.fn());

      expect(hot.on).toHaveBeenCalledWith(FORM_DOCK_EVENT, expect.any(Function));
    });

    it('wires the transport only once across multiple subscribes', async () => {
      const hot = makeHot();
      getHot.mockReturnValue(hot as unknown as ViteHot);
      const { subscribeToSnapshots } = await importFresh();

      subscribeToSnapshots(vi.fn());
      subscribeToSnapshots(vi.fn());

      expect(hot.on).toHaveBeenCalledTimes(1);
    });

    it('updates the snapshot when a relayed event arrives', async () => {
      const hot = makeHot();
      getHot.mockReturnValue(hot as unknown as ViteHot);
      const { subscribeToSnapshots, getSnapshot } = await importFresh();
      subscribeToSnapshots(vi.fn());

      const relayed = makeSnapshot(false);
      const handler = hot.on.mock.calls[0]?.[1] as (s: FormDockSnapshot) => void;
      handler(relayed);

      expect(getSnapshot()).toBe(relayed);
    });

    it('relays reported snapshots over the transport', async () => {
      const hot = makeHot();
      getHot.mockReturnValue(hot as unknown as ViteHot);
      const { reportFormState } = await importFresh();
      const snapshot = makeSnapshot();

      reportFormState(snapshot);

      expect(hot.send).toHaveBeenCalledWith(FORM_DOCK_EVENT, snapshot);
    });
  });

  describe('no transport (hot client absent)', () => {
    it('still stores and notifies locally without throwing', async () => {
      const { subscribeToSnapshots, reportFormState, getSnapshot } = await importFresh();
      const listener = vi.fn();
      const snapshot = makeSnapshot();

      subscribeToSnapshots(listener);
      expect(() => {
        reportFormState(snapshot);
      }).not.toThrow();

      expect(getSnapshot()).toBe(snapshot);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
