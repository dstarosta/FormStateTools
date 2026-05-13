import * as colors from './colors';
import { AttachIcon, DetachIcon, WarningIcon } from './icons';

type FormDockHeaderProps = Readonly<{
  minimized: boolean;
  detached: boolean;
  valid: boolean | null;
  onClick: (event: React.SyntheticEvent) => void;
  onRightClick: (event: React.SyntheticEvent) => void;
  onToggleDetach: (event: React.SyntheticEvent) => void;
}>;

function FormDockHeader({
  minimized,
  detached,
  valid,
  onClick,
  onRightClick,
  onToggleDetach,
}: FormDockHeaderProps) {
  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.shiftKey) {
      return;
    }
    if (event.key === ' ') {
      onClick(event);
    } else if (event.key === 'Enter') {
      onRightClick(event);
    }
  };

  const sizeAction = minimized ? 'expand' : 'collapse';

  const label = detached ? 'FORM TOOLS DETACHED' : `${sizeAction.toUpperCase()} FORM TOOLS`;

  const title = detached
    ? 'Click to re-attach the form tools panel.'
    : `Click to ${sizeAction} the form tools panel. Right mouse click maximizes the panel.`;

  const detachTitle = detached ? 'Attach panel' : 'Detach panel into a separate window';

  return (
    <div
      style={{
        display: 'flex',
        position: 'sticky',
        height: '1.5rem',
        top: 0,
        zIndex: 1,
        alignItems: 'stretch',
        borderTopStyle: 'solid',
        borderBottomStyle: 'solid',
        borderLeftStyle: 'none',
        borderRightStyle: 'none',
        borderWidth: '1px',
        borderColor: colors.PANEL_HEADER_BORDER_COLOR,
        backgroundColor: colors.PANEL_HEADER_BACKGROUND_COLOR,
        marginLeft: '-0.75rem',
        marginRight: '-0.75rem',
        userSelect: 'none',
      }}
    >
      <button
        type="button"
        title={detachTitle}
        aria-label={detachTitle}
        onClick={(event) => {
          event.stopPropagation();
          onToggleDetach(event);
        }}
        onFocus={(event) => {
          event.currentTarget.style.outline = `solid 1px ${colors.PANEL_HEADER_OUTLINE_COLOR}`;
        }}
        onBlur={(event) => {
          event.currentTarget.style.outline = 'none';
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '2.25rem',
          padding: 0,
          margin: 0,
          border: 'none',
          outline: 'none',
          outlineOffset: -1,
          cursor: 'pointer',
          color: colors.PANEL_HEADER_COLOR,
          backgroundColor: 'transparent',
        }}
      >
        {detached ? <AttachIcon /> : <DetachIcon />}
      </button>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          outline: 'none',
          outlineOffset: -1,
        }}
        role="button"
        tabIndex={0}
        title={title}
        onFocus={(event) => {
          event.currentTarget.style.outline = `solid 1px ${colors.PANEL_HEADER_OUTLINE_COLOR}`;
        }}
        onBlur={(event) => {
          event.currentTarget.style.outline = 'none';
        }}
        onClick={onClick}
        onContextMenu={onRightClick}
        onKeyDown={handleKeyPress}
      >
        <span
          style={{
            top: '-0.125rem',
            color: colors.PANEL_HEADER_COLOR,
            fontSize: '0.875rem',
            fontWeight: 600,
            letterSpacing: '0.05rem',
          }}
        >
          {label}
          <WarningIcon
            style={{
              display: 'inline-block',
              marginLeft: '0.3rem',
              marginTop: '-3px',
              color:
                valid === false
                  ? colors.PANEL_HEADER_ICON_INVALID_COLOR
                  : colors.PANEL_HEADER_ICON_UNINITIALIZED_COLOR,
              visibility: valid === true ? 'hidden' : 'visible',
            }}
            title={valid === null ? 'The form has not been validated.' : 'The form has errors.'}
          />
        </span>
      </div>
    </div>
  );
}

export default FormDockHeader;
