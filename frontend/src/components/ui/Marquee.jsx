import React from 'react'

export default function Marquee({ children, className = '', reverse = false, pauseOnHover = true }) {
  const copy = <div className="flex w-full shrink-0 items-center gap-4 pr-4">{children}</div>
  return (
    <div className={`group flex w-full overflow-hidden ${className}`}>
      <div
        className={`animate-marquee flex w-max shrink-0 ${
          pauseOnHover ? 'group-hover:[animation-play-state:paused]' : ''
        } ${reverse ? '[animation-direction:reverse]' : ''}`}
      >
        {copy}
        {copy}
      </div>
    </div>
  )
}
