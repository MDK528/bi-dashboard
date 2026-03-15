import React, { useState } from 'react'
import { X, Download, Maximize2, Minimize2, Lightbulb } from 'lucide-react'
import ChartRenderer from '../Charts/ChartRenderer.jsx'
import DataTable from '../Charts/DataTable.jsx'
import './DashboardPanel.css'

export default function DashboardPanel({ dashboard, onClose }) {
  const [expanded, setExpanded] = useState(false)

  if (!dashboard) return null

  const { title, summary, insights, charts, data, rowCount } = dashboard

  const chartsWithData = (charts || []).map(chart => ({ ...chart, data }))

  const handleExportCSV = () => {
    if (!data?.length) return
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row =>
      Object.values(row).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
    )
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(title || 'dashboard').replace(/\s+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`dash-panel ${expanded ? 'dash-panel--expanded' : ''}`}>
      {/* Header */}
      <div className="dash-panel__header">
        <div className="dash-panel__title-area">
          <h2 className="dash-panel__title">{title}</h2>
          <p className="dash-panel__meta">{rowCount?.toLocaleString()} records · {chartsWithData.length} chart{chartsWithData.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="dash-panel__actions">
          <button className="dash-btn" onClick={handleExportCSV} title="Export CSV">
            <Download size={14} />
          </button>
          <button className="dash-btn" onClick={() => setExpanded(v => !v)} title={expanded ? 'Collapse' : 'Expand'}>
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button className="dash-btn dash-btn--close" onClick={onClose} title="Close">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="dash-panel__summary">
          <p>{summary}</p>
        </div>
      )}

      {/* Insights */}
      {insights?.length > 0 && (
        <div className="dash-insights">
          <div className="dash-insights__hd">
            <Lightbulb size={13} color="var(--warning)" />
            <span>AI Insights</span>
          </div>
          <div className="dash-insights__list">
            {insights.map((ins, i) => (
              <div key={i} className="insight-chip">{ins}</div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="dash-panel__body">
        <div className={`charts-grid charts-grid--${Math.min(chartsWithData.length, 2)}`}>
          {chartsWithData.map((chart, idx) => (
            <div
              key={idx}
              className="chart-card animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.07}s` }}
            >
              <div className="chart-card__hd">
                <h3 className="chart-card__title">{chart.title}</h3>
                {chart.description && <p className="chart-card__desc">{chart.description}</p>}
              </div>
              <div className="chart-card__body">
                {chart.type === 'table'
                  ? <DataTable data={chart.data} />
                  : <ChartRenderer chart={chart} />
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
