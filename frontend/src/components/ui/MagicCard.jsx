import React from 'react'

export default function MagicCard({ children, className = '' }) {
  return (
    <div className={`magic-border relative rounded-2xl bg-white/[0.04] backdrop-blur-sm ${className}`}>
      {children}
    </div>
  )
}
