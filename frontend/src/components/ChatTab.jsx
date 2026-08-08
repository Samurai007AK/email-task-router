import React, { useState, useRef, useEffect } from 'react'
import ShimmerButton from './ui/ShimmerButton'
import SpotlightCard from './ui/SpotlightCard'
import { IconSend, IconRobot, IconSparkles } from './ui/Icons'

const CANDIDATE_ID = 'priya.sharma@gmail.com'

const SAMPLE_QUESTIONS = [
  'How many emails this batch were proposal or RFP-related?',
  'How many were marketing versus actual spam we correctly ignored?',
  'Show me everything sitting in triage and why.',
  "What's our spurious rate so far?",
  'Which high-priority tasks are low confidence?',
  'How many alliances emails came in?',
  'How many emails were about GST refunds?',
  'Send Aarti an email about the Meridian Steel RFP.',
  "What's the total deal value of all open RFPs?",
  'Did any thread get updated more than once?',
]

function ChatTab({ apiBase }) {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const handleSend = async () => {
    if (!query.trim()) return

    const userMessage = query
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setQuery('')
    setLoading(true)

    try {
      const response = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: CANDIDATE_ID,
          query: userMessage,
        }),
      })
      const data = await response.json()
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer, supporting_data: data.supporting_data },
      ])
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error: Could not reach the server. Please try again.',
          supporting_data: null,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSampleQuestion = (q) => {
    setQuery(q)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3 lg:h-[calc(100vh-220px)]">
      {/* Chat panel */}
      <SpotlightCard className="flex flex-col lg:col-span-2">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600">
            <IconRobot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Chat with Your Data</h2>
            <p className="text-xs text-slate-400">Ask questions about processed emails</p>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
              <IconSparkles className="h-8 w-8 text-violet-400/60" />
              <p className="text-sm text-slate-500">Ask a question about your processed emails</p>
            </div>
          )}
          {messages.map((msg, idx) =>
            msg.role === 'user' ? (
              <div key={idx} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-violet-600 to-fuchsia-600 px-4 py-3 text-sm text-white shadow-[0_8px_30px_rgba(168,85,247,0.35)]">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div key={idx} className="flex justify-start">
                <div className="max-w-[85%]">
                  <div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-slate-200 backdrop-blur-sm">
                    {msg.content}
                  </div>
                  {msg.supporting_data && Object.keys(msg.supporting_data).length > 0 && (
                    <details className="mt-1.5 group">
                      <summary className="cursor-pointer select-none text-xs text-slate-500 transition-colors hover:text-violet-300">
                        <span className="inline-flex items-center gap-1">
                          <IconSparkles className="h-3 w-3" /> Supporting data
                        </span>
                      </summary>
                      <pre className="mt-2 max-h-48 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-slate-400">
                        {JSON.stringify(msg.supporting_data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.05] px-4 py-3">
                <span className="typing-dot h-2 w-2 rounded-full bg-violet-400" />
                <span className="typing-dot h-2 w-2 rounded-full bg-fuchsia-400 [animation-delay:0.15s]" />
                <span className="typing-dot h-2 w-2 rounded-full bg-cyan-400 [animation-delay:0.3s]" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-white/10 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none backdrop-blur-sm transition-colors focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20"
              placeholder="Ask a question…"
            />
            <ShimmerButton onClick={handleSend} disabled={loading || !query.trim()} className="flex items-center gap-2">
              <IconSend className="h-4 w-4" />
              Send
            </ShimmerButton>
          </div>
        </div>
      </SpotlightCard>

      {/* Sample questions */}
      <SpotlightCard className="p-4 lg:h-full">
        <h3 className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold text-white">
          <IconSparkles className="h-4 w-4 text-violet-300" />
          Sample Questions
        </h3>
        <div className="space-y-2 overflow-y-auto lg:max-h-[calc(100vh-320px)]">
          {SAMPLE_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSampleQuestion(q)}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-left text-sm text-slate-400 transition-all duration-200 hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-slate-200"
            >
              {q}
            </button>
          ))}
        </div>
      </SpotlightCard>
    </div>
  )
}

export default ChatTab
