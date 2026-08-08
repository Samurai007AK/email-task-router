import React, { useState } from 'react'
import IngestTab from './components/IngestTab'
import DashboardTab from './components/DashboardTab'
import ChatTab from './components/ChatTab'

const API_BASE = import.meta.env.VITE_API_URL || ''

function App() {
  const [activeTab, setActiveTab] = useState('ingest')
  const [ingestResult, setIngestResult] = useState(null)

  const tabs = [
    { id: 'ingest', label: 'Ingest Emails' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'chat', label: 'Chat' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Email Task Router</h1>
            <p className="text-sm text-gray-500">ALUMNX AI LABS — FDE Intern Hiring Challenge</p>
          </div>
          <div className="text-sm text-gray-400">
            candidate_id: priya.sharma@gmail.com
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'ingest' && (
          <IngestTab apiBase={API_BASE} onIngestResult={setIngestResult} />
        )}
        {activeTab === 'dashboard' && (
          <DashboardTab apiBase={API_BASE} />
        )}
        {activeTab === 'chat' && (
          <ChatTab apiBase={API_BASE} />
        )}
      </main>
    </div>
  )
}

export default App
