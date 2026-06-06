import { useEffect } from 'react';

import { type FormDockSnapshot, clearFormState, reportFormState } from './plugin/snapshot-source';

/**
 * Reports the given form snapshot to the plugin-injected `FormDock` whenever it
 * changes. Use this instead of wiring `reportFormState` in your own effect.
 *
 * The `form` object from the `form-state` library is already snapshot-shaped, so
 * it can be passed directly:
 *
 * @example
 * ```tsx
 * const form = useFormState(schema);
 * useFormDock(form);
 * ```
 *
 * Pass `enabled` to control whether the snapshot is reported. When it is `false`
 * the dock behaves as if no form is rendered (the snapshot is cleared); toggling
 * it back to `true` resumes reporting. Defaults to `true` (always shown).
 *
 * @example
 * ```tsx
 * // Only show the dock when the URL carries `?devtools=true`.
 * useFormDock(form, new URLSearchParams(location.search).get('devtools') === 'true');
 * ```
 *
 * When the form unmounts, the snapshot is cleared so the dock behaves as if it
 * is no longer rendered.
 *
 * In a production build `reportFormState` is a no-op, so this hook costs nothing.
 */
export const useFormDock = (form: FormDockSnapshot, enabled = true): void => {
  const { initialState, formState, formStatus } = form;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    reportFormState({ initialState, formState, formStatus });
  }, [enabled, initialState, formState, formStatus]);

  useEffect(() => {
    if (!enabled) {
      clearFormState();
    }
  }, [enabled]);

  useEffect(() => {
    return () => {
      clearFormState();
    };
  }, []);
};
