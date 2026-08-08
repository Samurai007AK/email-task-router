import React from 'react'

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': 'true',
}

export const IconInbox = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
)

export const IconChart = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <path d="M3 3v18h18" />
    <path d="M7 15l3-4 3 3 4-6" />
  </svg>
)

export const IconChat = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

export const IconSparkles = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />
  </svg>
)

export const IconSend = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4z" />
  </svg>
)

export const IconRefresh = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <path d="M3 12a9 9 0 0 1 15.5-6.4L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15.5 6.4L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
)

export const IconAlert = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
)

export const IconCheck = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export const IconFile = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
)

export const IconRobot = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <rect x="4" y="8" width="16" height="12" rx="2" />
    <path d="M12 8V4" />
    <circle cx="12" cy="2" r="1" />
    <circle cx="9" cy="13" r="1" />
    <circle cx="15" cy="13" r="1" />
    <path d="M9 17h6" />
  </svg>
)

export const IconZap = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
  </svg>
)

export const IconUser = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
  </svg>
)

export const IconClock = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
)

export const IconCoin = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15 9.5c-.6-.9-1.7-1.5-3-1.5-1.9 0-3.5 1-3.5 2.5S10.1 13 12 13s3.5 1 3.5 2.5S13.9 18 12 18c-1.3 0-2.4-.6-3-1.5" />
    <path d="M12 6v12" />
  </svg>
)

export const IconTrash = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
  </svg>
)
