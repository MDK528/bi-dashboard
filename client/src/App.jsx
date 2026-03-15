import React, { useState, useEffect, useCallback } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import Sidebar from './components/UI/Sidebar.jsx'
import ChatPanel from './components/Chat/ChatPanel.jsx'
import DashboardPanel from './components/Dashboard/DashboardPanel.jsx'
import WelcomeScreen from './components/UI/WelcomeScreen.jsx'
import api from './utils/api.js'
import './App.css'

export default function App() {
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [activeDashboard, setActiveDashboard] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [schemas, setSchemas] = useState([])

  useEffect(() => {
    loadSessions()
    loadSchemas()
  }, [])

  const loadSessions = async () => {
    try {
      const { data } = await api.get('/session')
      setSessions(data.sessions || [])
    } catch (err) {
      console.error('Failed to load sessions', err)
    }
  }

  const loadSchemas = async () => {
    try {
      const { data } = await api.get('/schema')
      setSchemas(data.schemas || [])
    } catch (err) {
      console.error('Failed to load schemas', err)
    }
  }

  const loadHistory = useCallback(async (sessionId) => {
    try {
      const { data } = await api.get(`/query/history/${sessionId}`)
      const msgs = data.messages || []
      setMessages(msgs)
      const lastDash = [...msgs].reverse().find(m => m.dashboardData?.success)
      setActiveDashboard(lastDash ? lastDash.dashboardData : null)
    } catch (err) {
      console.error('Failed to load history', err)
    }
  }, [])

  const handleSelectSession = useCallback(async (session) => {
    setActiveSession(session)
    await loadHistory(session.id)
  }, [loadHistory])

  const handleNewSession = async () => {
    try {
      const { data } = await api.post('/session')
      setSessions(prev => [data.session, ...prev])
      setActiveSession(data.session)
      setMessages([])
      setActiveDashboard(null)
    } catch {
      toast.error('Failed to create session')
    }
  }

  const handleDeleteSession = async (sessionId) => {
    try {
      await api.delete(`/session/${sessionId}`)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (activeSession?.id === sessionId) {
        setActiveSession(null)
        setMessages([])
        setActiveDashboard(null)
      }
      toast.success('Session deleted')
    } catch {
      toast.error('Failed to delete session')
    }
  }

  const handleSendMessage = async (message) => {
    if (!message.trim() || isLoading) return

    let sessionId = activeSession?.id
    if (!sessionId) {
      try {
        const { data } = await api.post('/session')
        setSessions(prev => [data.session, ...prev])
        setActiveSession(data.session)
        sessionId = data.session.id
      } catch {
        toast.error('Failed to create session')
        return
      }
    }

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const { data } = await api.post('/query', { message, sessionId })

      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.success ? data.summary : data.error,
        dashboardData: data.success ? data : null,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])

      if (data.success) {
        setActiveDashboard(data)
        setSessions(prev =>
          prev.map(s =>
            s.id === sessionId && s.name === 'New Session'
              ? { ...s, name: message.substring(0, 45) + (message.length > 45 ? '…' : '') }
              : s
          )
        )
      } else {
        toast.error(data.error || 'Could not generate dashboard')
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          dashboardData: null,
          created_at: new Date().toISOString(),
        },
      ])
      toast.error('Request failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadSuccess = (result) => {
    toast.success(result.message)
    loadSchemas()
  }

  const showDashboard = activeDashboard !== null

  return (
    <div className="app-layout">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
          },
        }}
      />

      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(v => !v)}
        sessions={sessions}
        activeSession={activeSession}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        schemas={schemas}
        onUploadSuccess={handleUploadSuccess}
        onSchemaRefresh={loadSchemas}
      />

      <main className="app-main">
        {!activeSession && messages.length === 0 ? (
          <WelcomeScreen
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        ) : (
          <div className={`workspace ${showDashboard ? 'has-dashboard' : ''}`}>
            <ChatPanel
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              onSelectDashboard={setActiveDashboard}
              activeDashboard={activeDashboard}
            />
            {showDashboard && (
              <DashboardPanel
                dashboard={activeDashboard}
                onClose={() => setActiveDashboard(null)}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}
