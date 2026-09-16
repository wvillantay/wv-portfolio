/* Small inline icons — 1 em, currentColor, no external assets. */
const base = { width: '1em', height: '1em', viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true }

export const GitHubIcon = (p) => (
  <svg {...base} {...p}>
    <path
      fill="currentColor"
      d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.84c.85 0 1.7.11 2.5.33 1.9-1.29 2.74-1.02 2.74-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
    />
  </svg>
)

export const LinkedInIcon = (p) => (
  <svg {...base} {...p}>
    <path
      fill="currentColor"
      d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z"
    />
  </svg>
)

export const ArrowUpRight = (p) => (
  <svg {...base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
)

export const LockIcon = (p) => (
  <svg {...base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
)

export const FileIcon = (p) => (
  <svg {...base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </svg>
)

export const CloseIcon = (p) => (
  <svg {...base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const ClockIcon = (p) => (
  <svg {...base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
)

export const GraduationIcon = (p) => (
  <svg {...base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5Z" />
    <path d="M6.5 11.5v4.2c0 1.2 2.5 2.8 5.5 2.8s5.5-1.6 5.5-2.8v-4.2M21.5 9.5v5" />
  </svg>
)

export const ArrowLeft = (p) => (
  <svg {...base} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
)
