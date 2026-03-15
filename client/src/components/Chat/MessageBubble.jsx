import React, { useState } from 'react'
import { BarChart3, User, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Code } from 'lucide-react'
import './MessageBubble.css'

export default function MessageBubble({ message, onViewDashboard, isActiveDashboard }) {
  const [showSQL, setShowSQL] = useState(false)
  const isUser = message.role === 'user'
  const dash = message.dashboardData

  return (
    <div className={`msg ${isUser ? 'msg--user' : 'msg--ai'} animate-fade-in-up`}>
      {!isUser && (
        <div className="msg__avatar">
          <BarChart3 size={13} />
        </div>
      )}

      <div className="msg__body">
        {isUser ? (
          <div className="msg__bubble msg__bubble--user">
            <p>{message.content}</p>
          </div>
        ) : (
          <div className="msg__bubble msg__bubble--ai">
            {dash?.success ? (
              <>
                <div className="msg__success-header">
                  <CheckCircle size={13} color="var(--success)" />
                  <span className="msg__title">{dash.title}</span>
                </div>
                <p className="msg__summary">{dash.summary}</p>

                {dash.insights?.length > 0 && (
                  <ul className="msg__insights">
                    {dash.insights.map((ins, i) => <li key={i}>{ins}</li>)}
                  </ul>
                )}

                <p className="msg__meta">
                  {dash.rowCount?.toLocaleString()} rows · {dash.charts?.length} chart{dash.charts?.length !== 1 ? 's' : ''}
                </p>

                <div className="msg__actions">
                  <button
                    className={`btn-view ${isActiveDashboard ? 'btn-view--active' : ''}`}
                    onClick={onViewDashboard}
                  >
                    <BarChart3 size={12} />
                    {isActiveDashboard ? 'Viewing' : 'View Dashboard'}
                  </button>
                  <button className="btn-sql" onClick={() => setShowSQL(v => !v)}>
                    <Code size={12} />
                    SQL {showSQL ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  </button>
                </div>

                {showSQL && <pre className="msg__sql">{dash.sql}</pre>}
              </>
            ) : (
              <div className="msg__error">
                <AlertCircle size={13} color="var(--warning)" />
                <p>{message.content}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="msg__avatar msg__avatar--user">
          <User size={13} />
        </div>
      )}
    </div>
  )
}
