import React, { useState } from 'react'
import { BarChart3, TrendingUp, PieChart, ArrowRight, Sparkles } from 'lucide-react'
import './WelcomeScreen.css'

const EXAMPLES = [
  { icon: <TrendingUp size={15} />, text: 'Show monthly sales revenue trend for 2023 broken down by region' },
  { icon: <BarChart3 size={15} />,  text: 'Compare top 5 product categories by total revenue and profit margin' },
  { icon: <PieChart size={15} />,   text: 'Show revenue distribution by sales channel for Q3 2023' },
  { icon: <Sparkles size={15} />,   text: 'Which sales rep had the highest revenue in 2023 and what products did they sell?' },
]

export default function WelcomeScreen({ onSendMessage, isLoading }) {
  const [input, setInput] = useState('')

  const submit = (e) => {
    e?.preventDefault()
    if (input.trim()) onSendMessage(input.trim())
  }

  return (
    <div className="welcome">
      <div className="welcome__glow" />
      <div className="welcome__content">
        <div className="welcome__hero">
          <div className="welcome__icon">
            <BarChart3 size={38} color="var(--accent)" />
          </div>
          <h1 className="welcome__title">InsightAI</h1>
          <p className="welcome__sub">
            Ask any business question in plain English.<br />
            Get instant interactive dashboards powered by AI.
          </p>
        </div>

        <form className="welcome__form" onSubmit={submit}>
          <div className="welcome__input-wrap">
            <input
              className="welcome__input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. Show me monthly sales by region for 2023…"
              disabled={isLoading}
              autoFocus
            />
            <button type="submit" className="welcome__submit" disabled={!input.trim() || isLoading}>
              {isLoading ? <div className="btn-spinner" /> : <ArrowRight size={17} />}
            </button>
          </div>
        </form>

        <div className="welcome__examples">
          <p className="welcome__examples-label">Try an example</p>
          <div className="welcome__grid">
            {EXAMPLES.map((q, i) => (
              <button
                key={i}
                className="example-card"
                onClick={() => setInput(q.text)}
                disabled={isLoading}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <span className="example-card__icon">{q.icon}</span>
                <span className="example-card__text">{q.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
