import { useState } from 'react';
import { type KeyPath, JSONTree } from 'react-json-tree';
import type * as z from 'zod/mini';
import type { FormStateResponse } from 'form-state';

import type { CapturedErrorLevel, ErrorPattern } from './form-dock';
import FormDockHeader from './form-dock-header';
import ErrorToast from './error-toast';
import * as colors from './colors';

type FormDockSize = 'minimized' | 'normal' | 'maximized';

export type FormDockPanelProps = Readonly<{
  form: FormStateResponse<z.ZodMiniObject>;
  collapsed: boolean;
  captureErrors: CapturedErrorLevel;
  ignoreErrorPatterns: ErrorPattern[];
}>;

const FORM_SIZE_KEY = '__form-dock-size';

const HAS_SESSION_STORAGE = typeof globalThis.sessionStorage === 'object';

const getLabelColor = (key?: string | number) => {
  let color: string;

  switch (key) {
    case 'state': {
      color = colors.PANEL_STATE_LABEL_COLOR;
      break;
    }
    case 'status': {
      color = colors.PANEL_STATUS_LABEL_COLOR;
      break;
    }
    default: {
      color = colors.PANEL_LABEL_COLOR;
      break;
    }
  }

  return color;
};

const getKeyColor = (keys: KeyPath) => {
  const lastThreeKeys = keys.slice(-3);

  if (lastThreeKeys.length === 3 && lastThreeKeys[0] === 'errors') {
    return colors.PANEL_ERROR_KEY_COLOR;
  }

  return colors.PANEL_KEY_COLOR;
};

const getInitialSize = (collapsed: boolean) => {
  const storedSize = HAS_SESSION_STORAGE ? sessionStorage.getItem(FORM_SIZE_KEY) : null;

  if (typeof storedSize === 'string' && storedSize.length > 0) {
    return storedSize as FormDockSize;
  }

  return collapsed ? 'minimized' : 'normal';
};

const setInitialSize = (size: FormDockSize) => {
  if (HAS_SESSION_STORAGE) {
    sessionStorage.setItem(FORM_SIZE_KEY, size);
  }
};

const initializeRef = (element: HTMLElement | null) => {
  if (element) {
    if (!element.style.getPropertyValue('pointer-events')) {
      element.style.setProperty('pointer-events', 'auto', 'important');
    }
    if (!element.matches(':popover-open')) {
      element.showPopover();
    }
  }
};

function FormDockPanel({
  form,
  collapsed,
  captureErrors,
  ignoreErrorPatterns,
}: FormDockPanelProps) {
  const [size, setSize] = useState<FormDockSize>(getInitialSize(collapsed));

  const formJSON = JSON.stringify({
    initiailState: form.initialState,
    state: form.formState,
    status: form.formStatus,
  });
  const formObject = JSON.parse(formJSON) as object;

  const getHeight = () => {
    switch (size) {
      case 'minimized': {
        return '1.125rem';
      }
      case 'maximized': {
        return '100vh';
      }
      default: {
        return '30vh';
      }
    }
  };

  const handleClick = (event: React.SyntheticEvent) => {
    event.preventDefault();

    setSize((prev) => {
      const nextSize = prev === 'normal' ? 'minimized' : 'normal';
      setInitialSize(nextSize);

      return nextSize;
    });
  };

  const handleRightClick = (event: React.SyntheticEvent) => {
    event.preventDefault();

    setSize((prev) => {
      const nextSize = prev === 'maximized' ? 'normal' : 'maximized';
      setInitialSize(nextSize);

      return nextSize;
    });
  };

  return (
    <>
      <aside
        ref={initializeRef}
        popover="manual"
        style={{
          position: 'fixed',
          backgroundColor: colors.PANEL_BACKGROUND_COLOR,
          minWidth: '100%',
          width: '100%',
          height: getHeight(),
          paddingLeft: '0.75rem',
          paddingRight: '0.75rem',
          overflow: 'auto',
          left: 0,
          top: 'auto',
          bottom: 0,
        }}
      >
        {size === 'maximized' && (
          <style>{`
            body {
              overflow-y: auto;
              margin-bottom: 0;
            }
          `}</style>
        )}
        {size === 'minimized' && (
          <style>{`
            body {
              overflow-y: auto;
              margin-bottom: 2.5rem;
            }
          `}</style>
        )}
        {size === 'normal' && (
          <style>{`
            body {
              overflow-y: auto;
              margin-bottom: 33vh;
            }
          `}</style>
        )}
        <FormDockHeader
          minimized={size === 'minimized'}
          valid={form.formStatus.valid}
          onClick={handleClick}
          onRightClick={handleRightClick}
        />
        {size !== 'minimized' && (
          <JSONTree
            data={formObject}
            keyPath={['form']}
            theme={{
              base0D: colors.JSON_TREE_BASE_COLOR,
            }}
            labelRenderer={([key]) => (
              <span style={{ color: getLabelColor(key) }}>
                {key == null || key === '' ? '.' : key}
              </span>
            )}
            valueRenderer={(valueAsString, _value, ...keyPath) => (
              <span style={{ color: getKeyColor(keyPath) }}>{String(valueAsString)}</span>
            )}
            getItemString={(_type, _data, _itemType, itemString) => (
              <span style={{ color: colors.JSON_TREE_ITEM_COLOR, fontSize: '0.85rem' }}>
                [{itemString}]
              </span>
            )}
          />
        )}
      </aside>
      {captureErrors !== 'none' && (
        <ErrorToast captureErrors={captureErrors} ignoreErrorPatterns={ignoreErrorPatterns} />
      )}
    </>
  );
}

export default FormDockPanel;
