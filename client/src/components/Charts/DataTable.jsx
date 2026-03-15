import React, { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { formatNumber } from '../../utils/chartUtils.js'
import './DataTable.css'

const PAGE = 10

export default function DataTable({ data }) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir]  = useState('asc')
  const [page, setPage]        = useState(0)

  if (!data?.length) return <p className="tbl-empty">No data</p>

  const cols = Object.keys(data[0])

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setPage(0)
  }

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey]
        const n = typeof av === 'number' ? av - bv : String(av ?? '').localeCompare(String(bv ?? ''))
        return sortDir === 'asc' ? n : -n
      })
    : data

  const pages   = Math.ceil(sorted.length / PAGE)
  const visible = sorted.slice(page * PAGE, (page + 1) * PAGE)

  const fmt = (v) => {
    if (v === null || v === undefined) return '—'
    if (typeof v === 'number') return formatNumber(v)
    return String(v)
  }

  return (
    <div className="tbl-wrapper">
      <div className="tbl-scroll">
        <table className="tbl">
          <thead>
            <tr>
              {cols.map(col => (
                <th key={col} className="tbl__th" onClick={() => handleSort(col)}>
                  {col}
                  <span className="sort-icon">
                    {sortKey === col
                      ? (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
                      : <ChevronUp size={11} style={{ opacity: 0.25 }} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={i} className="tbl__row">
                {cols.map(col => (
                  <td key={col} className="tbl__td">{fmt(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="tbl__pagination">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>←</button>
          <span>{page + 1} / {pages} · {sorted.length.toLocaleString()} rows</span>
          <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}>→</button>
        </div>
      )}
    </div>
  )
}
