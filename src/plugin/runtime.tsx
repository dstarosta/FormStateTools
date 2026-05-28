import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import FormDock from '../form-dock';

const CONTAINER_ID = '__form-state-tools-root';

/**
 * Mounts a transport-driven `FormDock` into its own container appended to
 * `document.body`. Used by the `form-state-tools` Vite plugin, which injects a
 * call to this function in dev only. The dock receives no `form` prop, so it
 * subscribes to snapshots pushed via `reportFormState`.
 */
export const mountFormDock = (): void => {
  if (typeof document !== 'object') {
    return;
  }
  if (document.querySelector(`#${CONTAINER_ID}`)) {
    return;
  }

  const container = document.createElement('div');
  container.id = CONTAINER_ID;
  document.body.append(container);

  createRoot(container).render(
    <StrictMode>
      <FormDock devMode />
    </StrictMode>
  );
};
