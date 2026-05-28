import { useEffect } from 'react';

import { type FormDockSnapshot, reportFormState } from './plugin/snapshot-source';

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
 * In a production build `reportFormState` is a no-op, so this hook costs nothing.
 */
export const useFormDock = (form: FormDockSnapshot): void => {
  const { initialState, formState, formStatus } = form;

  useEffect(() => {
    reportFormState({ initialState, formState, formStatus });
  }, [initialState, formState, formStatus]);
};
