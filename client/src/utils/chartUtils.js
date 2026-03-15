export const CHART_COLORS = [
  '#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6',
  '#06b6d4','#ec4899','#84cc16','#f97316','#6366f1',
  '#14b8a6','#e879f9','#fbbf24','#34d399','#fb923c',
]

export function getChartColors(count) {
  return Array.from({ length: count }, (_, i) => CHART_COLORS[i % CHART_COLORS.length])
}

export const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#94a3b8',
        font: { family: 'Space Grotesk', size: 12 },
        padding: 16,
        usePointStyle: true,
        pointStyleWidth: 8,
      },
    },
    tooltip: {
      backgroundColor: '#1a2235',
      borderColor: '#1e3a5f',
      borderWidth: 1,
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
      padding: 12,
      cornerRadius: 8,
      titleFont: { family: 'Space Grotesk', weight: '600' },
      bodyFont:  { family: 'Space Grotesk' },
      callbacks: {
        label: (ctx) => {
          const val = ctx.parsed?.y ?? ctx.parsed ?? ctx.raw
          if (typeof val === 'number') return ` ${ctx.dataset?.label || ctx.label}: ${formatNumber(val)}`
          return ` ${ctx.label}: ${val}`
        },
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#64748b', font: { family: 'Space Grotesk', size: 11 } },
      grid:  { color: '#1e3a5f33', drawBorder: false },
    },
    y: {
      ticks: {
        color: '#64748b',
        font:  { family: 'Space Grotesk', size: 11 },
        callback: v => formatNumber(v),
      },
      grid: { color: '#1e3a5f33', drawBorder: false },
    },
  },
}

export function formatNumber(n) {
  if (n === null || n === undefined) return '—'
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  if (Number.isInteger(n))       return n.toLocaleString()
  return parseFloat(n.toFixed(2)).toLocaleString()
}
