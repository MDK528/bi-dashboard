import React, { useState } from 'react'
import {
  MessageSquare, Plus, Trash2, ChevronLeft, ChevronRight,
  Database, Upload, BarChart3, RefreshCw,
} from 'lucide-react'
import UploadModal from './UploadModal.jsx'
import './Sidebar.css'

export default function Sidebar({
  open, onToggle, sessions, activeSession,
  onSelectSession, onNewSession, onDeleteSession,
  schemas, onUploadSuccess, onSchemaRefresh,
}) {
  const [showUpload, setShowUpload] = useState(false)
  const [showSchema, setShowSchema] = useState(false)

  return (
    <>
      <aside className={`sidebar ${open ? 'sidebar--open' : 'sidebar--closed'}`}>
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <BarChart3 size={22} color="var(--accent)" />
            {open && <span className="sidebar__brand-name">InsightAI</span>}
          </div>
          <button className="sidebar__toggle" onClick={onToggle}>
            {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {open && (
          <>
            <div className="sidebar__actions">
              <button className="btn-new-chat" onClick={onNewSession}>
                <Plus size={15} />
                New Chat
              </button>
            </div>

            <nav className="sidebar__nav">
              <p className="sidebar__section-label">Recent Chats</p>
              {sessions.length === 0 && (
                <p className="sidebar__empty">No sessions yet</p>
              )}
              {sessions.map(session => (
                <div
                  key={session.id}
                  className={`sidebar__session ${activeSession?.id === session.id ? 'active' : ''}`}
                  onClick={() => onSelectSession(session)}
                >
                  <MessageSquare size={13} />
                  <span className="sidebar__session-name">{session.name}</span>
                  <button
                    className="sidebar__delete"
                    onClick={e => { e.stopPropagation(); onDeleteSession(session.id) }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </nav>

            <div className="sidebar__footer">
              <button className="sidebar__footer-btn" onClick={() => setShowSchema(v => !v)}>
                <Database size={14} />
                Data Schema
              </button>
              <button className="sidebar__footer-btn" onClick={() => setShowUpload(true)}>
                <Upload size={14} />
                Upload CSV
              </button>

              {showSchema && (
                <div className="sidebar__schema">
                  <div className="schema__header">
                    <p className="schema__title">Tables</p>
                    <button onClick={onSchemaRefresh}><RefreshCw size={12} /></button>
                  </div>
                  {schemas.map(s => (
                    <div key={s.tableName} className="schema__table">
                      <p className="schema__table-name">{s.tableName}</p>
                      <p className="schema__table-meta">
                        {s.rowCount?.toLocaleString()} rows · {s.columns?.length} cols
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </aside>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={result => { onUploadSuccess(result); setShowUpload(false) }}
        />
      )}
    </>
  )
}
