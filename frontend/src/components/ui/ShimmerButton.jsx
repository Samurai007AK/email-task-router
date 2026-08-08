import React from 'react'

export default function ShimmerButton({
  children,
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      {...props}
      className={`btn-sheen group relative overflow-hidden rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 bg-[linear-gradient(110deg,#dc2626,#f43f5e_45%,#dc2626_90%)] bg-[length:220%_100%] hover:bg-[position:right_center] hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(239,68,68,0.5)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none ${className}`}
    >
      {children}
    </button>
  )
}
