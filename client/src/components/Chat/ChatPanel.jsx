import React, { useState, useRef, useEffect } from 'react'
import { ArrowUp, BarChart3, Loader2 } from 'lucide-react'
import MessageBubble from './MessageBubble.jsx'
import './ChatPanel.css'

export default function ChatPanel({ messages, isLoading, onSendMessage, onSelectDashboard, activeDashboard }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const submit = (e) => {
    e?.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim())
      setInput('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  const handleChange = (e) => {
    setInput(e.target.value)
    const el = textareaRef.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 150) + 'px' }
  }

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id || idx}
            message={msg}
            onViewDashboard={() => msg.dashboardData && onSelectDashboard(msg.dashboardData)}
            isActiveDashboard={msg.dashboardData && activeDashboard?.title === msg.dashboardData?.title}
          />
        ))}

        {isLoading && (
          <div className="chat-loading animate-fade-in">
            <div className="chat-loading__avatar"><BarChart3 size={13} /></div>
            <div className="chat-loading__dots">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <form className="chat-input-form" onSubmit={submit}>
          <div className="chat-input-wrap">
            <textarea
              ref={textareaRef}
              className="chat-input"
              value={input}
              onChange={handleChange}
              onKeyDown={handleKey}
              placeholder="Ask a follow-up or refine the dashboard…"
              disabled={isLoading}
              rows={1}
            />
            <button type="submit" className="chat-submit" disabled={!input.trim() || isLoading}>
              {isLoading
                ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                : <ArrowUp size={15} />}
            </button>
          </div>
          <p className="chat-hint">Enter to send · Shift+Enter for new line</p>
        </form>
      </div>
    </div>
  )
}
