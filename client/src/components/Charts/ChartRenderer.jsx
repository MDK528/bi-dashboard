import React, { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis,
} from 'recharts'
import { CHART_COLORS, CHART_DEFAULTS, formatNumber } from '../../utils/chartUtils.js'
import './ChartRenderer.css'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
)

function buildChartData(chart) {
  const { data, xKey, yKey, colorKey, type, limit = 50, sortBy } = chart
  if (!data?.length) return null

  const keys  = Object.keys(data[0])
  const resolvedX = xKey || keys[0]
  const resolvedY = yKey || keys.find(k => typeof data[0][k] === 'number') || keys[1]

  let rows = [...data]
  if (sortBy === 'value') rows.sort((a, b) => Number(b[resolvedY] ?? 0) - Number(a[resolvedY] ?? 0))
  rows = rows.slice(0, limit)

  // Grouped (multi-series)
  if (colorKey && colorKey !== resolvedX) {
    const groups = [...new Set(rows.map(r => r[colorKey]))]
    const labels = [...new Set(rows.map(r => String(r[resolvedX])))]
    const datasets = groups.map((grp, i) => ({
      label: String(grp),
      data: labels.map(label => {
        const row = rows.find(r => String(r[resolvedX]) === label && r[colorKey] === grp)
        return row ? Number(row[resolvedY] ?? 0) : 0
      }),
      backgroundColor: CHART_COLORS[i % CHART_COLORS.length] + (type === 'bar' ? 'bb' : ''),
      borderColor: CHART_COLORS[i % CHART_COLORS.length],
      borderWidth: 2,
      tension: 0.4,
      fill: false,
      pointRadius: 3,
      pointHoverRadius: 5,
    }))
    return { labels, datasets }
  }

  // Single-series
  const labels = rows.map(r => String(r[resolvedX]))
  const values = rows.map(r => Number(r[resolvedY] ?? 0))

  if (type === 'pie' || type === 'doughnut') {
    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: CHART_COLORS.slice(0, labels.length).map(c => c + 'bb'),
        borderColor: CHART_COLORS.slice(0, labels.length),
        borderWidth: 2,
        hoverOffset: 8,
      }],
    }
  }

  return {
    labels,
    datasets: [{
      label: resolvedY,
      data: values,
      backgroundColor: type === 'bar'
        ? CHART_COLORS.slice(0, values.length).map(c => c + 'bb')
        : CHART_COLORS[0] + '2e',
      borderColor: CHART_COLORS[0],
      borderWidth: 2,
      tension: 0.4,
      fill: type === 'area',
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: CHART_COLORS[0],
    }],
  }
}

export default function ChartRenderer({ chart }) {
  const { type } = chart
  const chartData = useMemo(() => buildChartData(chart), [chart])

  if (!chartData && type !== 'area' && type !== 'scatter') {
    return <div className="chart-empty">No data available</div>
  }

  /* ── Recharts: Area ── */
  if (type === 'area') {
    const keys   = chart.data?.length ? Object.keys(chart.data[0]) : []
    const xKey   = chart.xKey || keys[0]
    const yKey   = chart.yKey || keys.find(k => typeof chart.data?.[0]?.[k] === 'number') || keys[1]
    const rows   = (chart.data || []).slice(0, chart.limit || 50)
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 5, right: 18, left: 8, bottom: 5 }}>
          <defs>
            <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f33" />
          <XAxis dataKey={xKey} tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Space Grotesk' }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Space Grotesk' }} tickFormatter={formatNumber} />
          <ReTooltip
            contentStyle={{ background: '#1a2235', border: '1px solid #1e3a5f', borderRadius: 8, fontFamily: 'Space Grotesk', fontSize: 12 }}
            labelStyle={{ color: '#f1f5f9' }}
            itemStyle={{ color: '#94a3b8' }}
            formatter={v => [formatNumber(v)]}
          />
          <Area type="monotone" dataKey={yKey} stroke="#3b82f6" fill="url(#aGrad)" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  /* ── Recharts: Scatter ── */
  if (type === 'scatter') {
    const keys = chart.data?.length ? Object.keys(chart.data[0]) : []
    const xKey = chart.xKey || keys[0]
    const yKey = chart.yKey || keys[1]
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 5, right: 18, left: 8, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f33" />
          <XAxis dataKey={xKey} name={xKey} tick={{ fill: '#64748b', fontSize: 11 }} type="number" />
          <YAxis dataKey={yKey} name={yKey} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={formatNumber} />
          <ZAxis range={[36, 36]} />
          <ReTooltip
            contentStyle={{ background: '#1a2235', border: '1px solid #1e3a5f', borderRadius: 8, fontFamily: 'Space Grotesk', fontSize: 12 }}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Scatter data={(chart.data || []).slice(0, chart.limit || 100)} fill="#3b82f6" fillOpacity={0.7} />
        </ScatterChart>
      </ResponsiveContainer>
    )
  }

  /* ── Chart.js: Bar / Line / Pie / Doughnut ── */
  const noScales = {
    ...CHART_DEFAULTS,
    scales: undefined,
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: { ...CHART_DEFAULTS.plugins.legend, display: true },
    },
  }
  const withScales = {
    ...CHART_DEFAULTS,
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: {
        ...CHART_DEFAULTS.plugins.legend,
        display: chartData?.datasets?.length > 1,
      },
    },
  }

  return (
    <div className="chart-wrapper">
      {type === 'bar'      && <Bar      data={chartData} options={withScales} />}
      {type === 'line'     && <Line     data={chartData} options={withScales} />}
      {type === 'pie'      && <Pie      data={chartData} options={noScales}   />}
      {type === 'doughnut' && <Doughnut data={chartData} options={noScales}   />}
    </div>
  )
}
