import { useState } from 'react';
import { type KeyPath, JSONTree } from 'react-json-tree';
import { type ZodObject } from 'zod/v4';
import type { FormStateResponse } from 'form-state';

import FormDockHeader from './form-dock-header';
import ErrorToast from './error-toast';
import type { CapturedErrorLevel, ErrorPattern } from './form-dock';

type FormDockSize = 'minimized' | 'normal' | 'maximized';

export type FormDockPanelProps = Readonly<{
  form: FormStateResponse<ZodObject>;
  collapsed: boolean;
  captureErrors: CapturedErrorLevel;
  ignoreErrorPatterns: ErrorPattern[];
}>;

const getLabelColor = (key?: string | number) => {
  let color: string;

  switch (key) {
    case 'state': {
      color = 'oklch(79.2% 0.209 151.711)';
      break;
    }
    case 'status': {
      color = 'oklch(94.5% 0.129 101.54)';
      break;
    }
    default: {
      color = 'oklch(87.2% 0.01 258.338)';
      break;
    }
  }

  return color;
};

const getKeyColor = (keys: KeyPath) => {
  const lastThreeKeys = keys.slice(-3);

  if (lastThreeKeys.length === 3 && lastThreeKeys[0] === 'errors') {
    return 'oklch(70.4% 0.191 22.216)';
  }

  return 'oklch(91.7% 0.08 205.041)';
};

function FormDockPanel({
  form,
  collapsed,
  captureErrors,
  ignoreErrorPatterns,
}: FormDockPanelProps) {
  const [size, setSize] = useState<FormDockSize>(collapsed ? 'minimized' : 'normal');

  const formJSON = JSON.stringify({ state: form.formState, status: form.formStatus });
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

    setSize((prev) => (prev === 'normal' ? 'minimized' : 'normal'));
  };

  const handleRightClick = (event: React.SyntheticEvent) => {
    event.preventDefault();

    setSize((prev) => (prev === 'maximized' ? 'normal' : 'maximized'));
  };

  return (
    <>
      <aside
        style={{
          position: 'fixed',
          backgroundColor: 'rgb(0, 43, 54)',
          minWidth: '100%',
          width: '100%',
          height: getHeight(),
          paddingLeft: '0.75rem',
          paddingRight: '0.75rem',
          overflow: 'auto',
          zIndex: 1000,
          left: 0,
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
              base0D: 'oklch(87.2% 0.01 258.338)',
            }}
            labelRenderer={([key]) => <span style={{ color: getLabelColor(key) }}>{key}</span>}
            valueRenderer={(valueAsString, _value, ...keyPath) => {
              return <span style={{ color: getKeyColor(keyPath) }}>{String(valueAsString)}</span>;
            }}
            getItemString={(_type, _data, _itemType, itemString) => (
              <span style={{ color: 'oklch(67.8% 0 0)', fontSize: '0.85rem' }}>[{itemString}]</span>
            )}
          />
        )}
      </aside>
      {captureErrors && (
        <ErrorToast captureErrors={captureErrors} ignoreErrorPatterns={ignoreErrorPatterns} />
      )}
    </>
  );
}

export default FormDockPanel;
