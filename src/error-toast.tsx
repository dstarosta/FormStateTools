/* eslint-disable @typescript-eslint/no-base-to-string */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { CapturedErrorLevel, ErrorPattern } from './form-dock';

type ErrorWrapper = { type: 'console' | 'thrown'; value: unknown };

type ErrorToastProps = Readonly<{
  captureErrors: CapturedErrorLevel;
  ignoreErrorPatterns: ErrorPattern[];
}>;

const originalConsoleError = console.error;

const formatValue = ({ type, value }: ErrorWrapper) => {
  const prefix = type === 'console' ? 'ConsoleError: ' : '';

  if (typeof value === 'function') {
    return prefix + '[function]';
  }

  if (value instanceof Promise) {
    return prefix + '[Promise]';
  }

  if (typeof value !== 'object') {
    return prefix + String(value);
  }

  if (value instanceof Error) {
    return prefix + value.toString();
  }

  try {
    return prefix + JSON.stringify(value, null, 2);
  } catch {
    return prefix + String(value); // cannot be serialized
  }
};

const isEmptyError = ({ value }: ErrorWrapper) => {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return true;
  }

  if (Array.isArray(value) && value.length === 0) {
    return true;
  }

  return false;
};

const isIgnoredError = (error: ErrorWrapper, patterns: ErrorPattern[]) => {
  const stringValue = formatValue(error);

  for (const pattern of patterns) {
    console.info(pattern, error.value, stringValue);

    if (pattern instanceof RegExp) {
      if (pattern.test(stringValue)) {
        return true;
      }
    } else if (pattern.includes(stringValue)) {
      return true;
    }
  }

  return false;
};

function ErrorToast({ captureErrors, ignoreErrorPatterns }: ErrorToastProps) {
  const [errors, setErrors] = useState<ErrorWrapper[]>([]);

  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleConsoleError = useCallback(
    (...data: unknown[]) => {
      const type = 'console';

      const filteredErrors = data
        .map<ErrorWrapper>((value) => ({ type, value }))
        .filter((error) => !isEmptyError(error) && !isIgnoredError(error, ignoreErrorPatterns));

      if (filteredErrors.length > 0) {
        setErrors(filteredErrors);
      }

      originalConsoleError(...data);
    },
    [ignoreErrorPatterns, setErrors]
  );

  const handleThrownError = useCallback(
    (event: ErrorEvent) => {
      const error: ErrorWrapper = {
        type: 'thrown',
        value: event.error,
      };

      if (!isEmptyError(error) && !isIgnoredError(error, ignoreErrorPatterns)) {
        setErrors([error]);
      }
    },
    [ignoreErrorPatterns, setErrors]
  );

  const handleClose = useCallback(() => {
    setErrors([]);
  }, [setErrors]);

  useEffect(() => {
    const captureConsoleErrors = captureErrors === 'all' || captureErrors === 'console';
    const captureThrownErrors = captureErrors === 'all' || captureErrors === 'thrown';

    if (captureConsoleErrors) {
      console.error = handleConsoleError;
    }

    if (captureThrownErrors) {
      globalThis.addEventListener('error', handleThrownError);
    }

    const dialog = dialogRef.current;

    if (dialog) {
      dialog.addEventListener('close', handleClose);
    }

    return () => {
      if (dialog) {
        dialog.removeEventListener('close', handleClose);
      }

      if (captureThrownErrors) {
        globalThis.removeEventListener('error', handleThrownError);
      }

      if (captureConsoleErrors) {
        console.error = originalConsoleError;
      }
    };
  }, [captureErrors, ignoreErrorPatterns, handleConsoleError, handleThrownError, handleClose]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (errors.length > 0) {
      if (!dialog.open) {
        dialog.show();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [errors.length]);

  return (
    <dialog
      ref={dialogRef}
      closedby="closerequest"
      style={{
        position: 'fixed',
        top: '0.5rem',
        right: '0.5rem',
        left: 'auto',
        bottom: 'auto',
        padding: '1rem',
        zIndex: 1000,
        fontSize: '0.85rem',
        color: '#ffffff',
        backgroundColor: 'oklch(57.7% 0.245 27.325)',
        maxHeight: '95%',
        minWidth: '265px',
        maxWidth: '20%',
        overflow: 'auto',
        boxShadow: '5px 5px 5px rgba(0, 0, 0, 0.2)',
        borderRadius: '5px',
        opacity: '0.8',
      }}
    >
      <h3
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'oklch(94.5% 0.129 101.54)',
          position: 'relative',
          width: '100%',
        }}
      >
        <button
          type="button"
          title="Hide error"
          tabIndex={0}
          onClick={handleClose}
          onFocus={(e) => {
            e.currentTarget.style.outline = 'solid 2px oklch(94.5% 0.129 101.54)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none';
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'oklch(94.5% 0.129 101.54)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#ffffff';
          }}
          style={{
            position: 'absolute',
            top: '3px',
            right: 0,
            left: 'auto',
            width: '1rem',
            height: '1rem',
            padding: 0,
            margin: 0,
            outline: 0,
            outlineOffset: 1,
            borderStyle: 'none',
            color: '#ffffff',
            backgroundColor: 'transparent',
          }}
        >
          <svg
            width="1rem"
            height="1rem"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <p style={{ cursor: 'default', userSelect: 'none' }}>
          MOST RECENT {errors.some((error) => error.type === 'console') ? 'CONSOLE ' : ''}ERROR
        </p>
      </h3>
      {errors
        .filter((error) => !isEmptyError(error))
        .map((error, index) => (
          <pre
            key={String(index)}
            style={{
              fontWeight: 600,
              marginTop: '10px',
              wordBreak: 'break-word',
              whiteSpace: typeof error.value === 'object' ? undefined : 'wrap',
            }}
          >
            {formatValue(error)}
          </pre>
        ))}
    </dialog>
  );
}

export default ErrorToast;
