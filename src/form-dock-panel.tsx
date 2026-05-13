import { useCallback, useEffect, useMemo, useState } from 'react';
import { JSONTree, type KeyPath } from 'react-json-tree';
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
const VALID_SIZES = new Set<FormDockSize>(['minimized', 'normal', 'maximized']);

const hasSessionStorage = () => typeof globalThis.sessionStorage === 'object';

const SIZE_TO_HEIGHT: Record<FormDockSize, string> = {
  minimized: '1.125rem',
  normal: '30vh',
  maximized: '100vh',
};

const SIZE_TO_BODY_MARGIN: Record<FormDockSize, string> = {
  minimized: '2.5rem',
  normal: '33vh',
  maximized: '0',
};

const getLabelColor = (key?: string | number) => {
  switch (key) {
    case 'state': {
      return colors.PANEL_STATE_LABEL_COLOR;
    }
    case 'status': {
      return colors.PANEL_STATUS_LABEL_COLOR;
    }
    default: {
      return colors.PANEL_LABEL_COLOR;
    }
  }
};

const getKeyColor = (keys: KeyPath) => {
  const lastThreeKeys = keys.slice(-3);

  if (lastThreeKeys.length === 3 && lastThreeKeys[0] === 'errors') {
    return colors.PANEL_ERROR_KEY_COLOR;
  }

  return colors.PANEL_KEY_COLOR;
};

const getInitialSize = (collapsed: boolean): FormDockSize => {
  const storedSize = hasSessionStorage() ? sessionStorage.getItem(FORM_SIZE_KEY) : null;

  if (typeof storedSize === 'string' && VALID_SIZES.has(storedSize as FormDockSize)) {
    return storedSize as FormDockSize;
  }

  return collapsed ? 'minimized' : 'normal';
};

const setStoredSize = (size: FormDockSize) => {
  if (hasSessionStorage()) {
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

const sortObject = <T,>(obj: T): T => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }
  const sortedKeys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
  const result = {} as Record<string, unknown>;

  for (const key of sortedKeys) {
    const value = (obj as Record<string, unknown>)[key];
    result[key] = sortObject(value);
  }

  return result as T;
};

const renderLabel = ([key]: KeyPath) => (
  <span style={{ color: getLabelColor(key) }}>{key === undefined || key === '' ? '.' : key}</span>
);

const renderValue = (valueAsString: unknown, _value: unknown, ...keyPath: KeyPath) => (
  <span style={{ color: getKeyColor(keyPath) }}>{String(valueAsString)}</span>
);

const renderItemString = (
  _type: unknown,
  _data: unknown,
  _itemType: React.ReactNode,
  itemString: React.ReactNode
) => (
  <span style={{ color: colors.JSON_TREE_ITEM_COLOR, fontSize: '0.85rem' }}>[{itemString}]</span>
);

function FormDockPanel({
  form,
  collapsed,
  captureErrors,
  ignoreErrorPatterns,
}: FormDockPanelProps) {
  const [size, setSize] = useState<FormDockSize>(() => getInitialSize(collapsed));

  const formObject = useMemo(() => {
    return sortObject(
      JSON.parse(
        JSON.stringify({
          initialState: form.initialState,
          state: form.formState,
          status: form.formStatus,
        })
      ) as Record<string, unknown>
    );
  }, [form]);

  useEffect(() => {
    const prevMargin = document.body.style.marginBottom;
    const prevOverflow = document.body.style.overflowY;

    document.body.style.overflowY = 'auto';
    document.body.style.marginBottom = SIZE_TO_BODY_MARGIN[size];

    return () => {
      document.body.style.marginBottom = prevMargin;
      document.body.style.overflowY = prevOverflow;
    };
  }, [size]);

  const handleClick = useCallback((event: React.SyntheticEvent) => {
    event.preventDefault();

    setSize((prev) => {
      const nextSize = prev === 'normal' ? 'minimized' : 'normal';
      setStoredSize(nextSize);

      return nextSize;
    });
  }, []);

  const handleRightClick = useCallback((event: React.SyntheticEvent) => {
    event.preventDefault();

    setSize((prev) => {
      const nextSize = prev === 'maximized' ? 'normal' : 'maximized';
      setStoredSize(nextSize);

      return nextSize;
    });
  }, []);

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
          height: SIZE_TO_HEIGHT[size],
          paddingLeft: '0.75rem',
          paddingRight: '0.75rem',
          overflow: 'auto',
          left: 0,
          top: 'auto',
          bottom: 0,
          fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
          fontSize: '14px',
          lineHeight: 1.8,
        }}
      >
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
            labelRenderer={renderLabel}
            valueRenderer={renderValue}
            getItemString={renderItemString}
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
