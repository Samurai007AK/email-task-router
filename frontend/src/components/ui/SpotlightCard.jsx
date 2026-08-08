import React, { useRef } from 'react'

export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(239, 68, 68, 0.14)',
}) {
  const ref = useRef(null)

  const onMouseMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm transition-colors duration-300 hover:border-white/20 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(560px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${spotlightColor}, transparent 45%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}
