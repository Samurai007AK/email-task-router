import React, { useState } from 'react'
import IngestTab from './components/IngestTab'
import DashboardTab from './components/DashboardTab'
import ChatTab from './components/ChatTab'
import AuroraBackground from './components/ui/AuroraBackground'
import AnimatedTabs from './components/ui/AnimatedTabs'
import GradientText from './components/ui/GradientText'
import { IconInbox, IconChart, IconChat, IconSparkles } from './components/ui/Icons'

const API_BASE = import.meta.env.VITE_API_URL || ''

const TABS = [
  { id: 'ingest', label: 'Ingest Emails', icon: <IconInbox className="h-4 w-4" /> },
  { id: 'dashboard', label: 'Dashboard', icon: <IconChart className="h-4 w-4" /> },
  { id: 'chat', label: 'Chat', icon: <IconChat className="h-4 w-4" /> },
]

function App() {
  const [activeTab, setActiveTab] = useState('ingest')

  return (
    <div className="min-h-screen text-slate-100">
      <AuroraBackground />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#06060f]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="animate-glow flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-rose-600">
              <IconSparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                <GradientText>Email Task Router</GradientText>
              </h1>
              <p className="text-xs text-slate-400">ALUMNX AI LABS — FDE Intern Hiring Challenge</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-xs text-slate-300 sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
            candidate: priya.sharma@gmail.com
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <AnimatedTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-6">
        <div key={activeTab} className="animate-fade-up">
          {activeTab === 'ingest' && <IngestTab apiBase={API_BASE} />}
          {activeTab === 'dashboard' && <DashboardTab apiBase={API_BASE} />}
          {activeTab === 'chat' && <ChatTab apiBase={API_BASE} />}
        </div>
      </main>
    </div>
  )
}

export default App
