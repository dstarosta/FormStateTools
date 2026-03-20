import * as colors from './colors';

type FormDockHeaderProps = Readonly<{
  minimized: boolean;
  valid: boolean | null;
  onClick: (event: React.SyntheticEvent) => void;
  onRightClick: (event: React.SyntheticEvent) => void;
}>;

function FormDockHeader({ minimized, valid, onClick, onRightClick }: FormDockHeaderProps) {
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

  const title = `Click to ${minimized ? 'expand' : 'collapse'} the form tools panel. Right mouse click maximizes the panel.`;

  return (
    <div
      style={{
        display: 'flex',
        position: 'sticky',
        height: '1rem',
        top: 0,
        zIndex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderTopStyle: 'solid',
        borderBottomStyle: 'solid',
        borderLeftStyle: 'none',
        borderRightStyle: 'none',
        borderWidth: '1px',
        borderColor: colors.PANEL_HEADER_BORDER_COLOR,
        backgroundColor: colors.PANEL_HEADER_BACKGROUND_COLOR,
        marginLeft: '-0.75rem',
        marginRight: '-0.75rem',
        cursor: 'pointer',
        outline: 'none',
        outlineOffset: -1,
        userSelect: 'none',
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
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.05rem',
          marginRight: '5%',
        }}
      >
        {minimized ? 'EXPAND' : 'COLLAPSE'} FORM TOOLS
        <svg
          xmlns="http://www.w3.org/2000/svg"
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
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>
            {valid === null ? 'The form has not been validated.' : 'The form has errors.'}
          </title>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
      </span>
    </div>
  );
}

export default FormDockHeader;
