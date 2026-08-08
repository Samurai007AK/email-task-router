import React from 'react'

export default function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#06060f]">
      {/* Gradient blobs */}
      <div className="animate-aurora absolute -top-44 -left-44 h-[36rem] w-[36rem] rounded-full bg-violet-600/25 blur-[130px]" />
      <div className="animate-aurora absolute top-1/3 -right-44 h-[32rem] w-[32rem] rounded-full bg-fuchsia-600/20 blur-[130px] [animation-delay:-6s]" />
      <div className="animate-aurora absolute -bottom-48 left-1/4 h-[30rem] w-[30rem] rounded-full bg-cyan-500/15 blur-[130px] [animation-delay:-12s]" />
      {/* Dotted grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:26px_26px]" />
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(6,6,15,0.65)_72%,#06060f_100%)]" />
    </div>
  )
}
