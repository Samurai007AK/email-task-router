import React, { useEffect, useRef, useState } from 'react'

export default function NumberTicker({ value, decimals = 0, className = '', duration = 1.4 }) {
  const [display, setDisplay] = useState(0)
  const frame = useRef(null)

  useEffect(() => {
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(value * eased)
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [value, duration])

  return (
    <span className={className}>
      {display.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  )
}
