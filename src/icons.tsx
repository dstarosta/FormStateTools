type WarningIconProps = Readonly<{
  style?: React.CSSProperties;
  title?: string;
}>;

export const DetachIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <path d="M15 3h6v6" />
    <path d="M10 14L21 3" />
  </svg>
);

export const AttachIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 11V5a2 2 0 0 1 2-2h6" />
    <path d="M9 3H3v6" />
    <path d="M3 3l9 9" />
    <path d="M14 21h5a2 2 0 0 0 2-2v-5" />
    <path d="M14 14h7v7" />
  </svg>
);

export const WarningIcon = ({ style, title }: WarningIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    style={style}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {title !== undefined && <title>{title}</title>}
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);
