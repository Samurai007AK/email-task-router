import React, { useState } from 'react'

const CANDIDATE_ID = 'priya.sharma@gmail.com'

const SAMPLE_QUESTIONS = [
  "How many emails this batch were proposal or RFP-related?",
  "How many were marketing versus actual spam we correctly ignored?",
  "Show me everything sitting in triage and why.",
  "What's our spurious rate so far?",
  "Which high-priority tasks are low confidence?",
  "How many alliances emails came in?",
  "How many emails were about GST refunds?",
  "Send Aarti an email about the Meridian Steel RFP.",
  "What's the total deal value of all open RFPs?",
  "Did any thread get updated more than once?"
]

function ChatTab({ apiBase }) {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!query.trim()) return

    const userMessage = query
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setQuery('')
    setLoading(true)

    try {
      const response = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: CANDIDATE_ID,
          query: userMessage
        })
      })
      const data = await response.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        supporting_data: data.supporting_data
      }])
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error: Could not reach the server. Please try again.',
        supporting_data: null
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleSampleQuestion = (q) => {
    setQuery(q)
  }

  return (
    <div className="grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Chat Panel */}
      <div className="col-span-2 bg-white rounded-lg border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Chat with Your Data</h2>
          <p className="text-sm text-gray-500">Ask questions about processed emails</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              Ask a question about your processed emails
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl px-4 py-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <div className="text-sm">{msg.content}</div>
                {msg.supporting_data && Object.keys(msg.supporting_data).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                    <strong>Supporting Data:</strong>
                    <pre className="mt-1 overflow-x-auto">{JSON.stringify(msg.supporting_data, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-3 rounded-lg">
                <div className="text-sm text-gray-500">Thinking...</div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ask a question..."
            />
            <button
              onClick={handleSend}
              disabled={loading || !query.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Sample Questions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Sample Questions</h3>
        <div className="space-y-2">
          {SAMPLE_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSampleQuestion(q)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ChatTab
