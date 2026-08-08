import React from 'react'

export default function AnimatedTabs({ tabs, active, onChange, className = '' }) {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.05] p-1.5 backdrop-blur-sm ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative rounded-xl px-5 py-2 text-sm font-medium transition-all duration-300 ${
              isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isActive && (
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-[0_0_22px_rgba(168,85,247,0.45)]" />
            )}
            <span className="relative flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
