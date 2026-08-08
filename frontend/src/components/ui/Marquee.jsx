import React from 'react'

export default function Marquee({ children, className = '', reverse = false, pauseOnHover = true }) {
  return (
    <div className={`group flex w-full overflow-hidden ${className}`}>
      <div
        className={`animate-marquee flex w-max shrink-0 items-center gap-4 ${
          pauseOnHover ? 'group-hover:[animation-play-state:paused]' : ''
        } ${reverse ? '[animation-direction:reverse]' : ''}`}
      >
        {children}
        {children}
      </div>
    </div>
  )
}
