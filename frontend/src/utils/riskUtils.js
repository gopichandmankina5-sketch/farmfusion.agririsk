// ── Risk level helpers ──────────────────────────────────────────────────────

export const RISK_LEVELS = {
  LOW:      { label: 'LOW',      color: '#22c55e', bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300' },
  MEDIUM:   { label: 'MEDIUM',   color: '#eab308', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  HIGH:     { label: 'HIGH',     color: '#f97316', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  CRITICAL: { label: 'CRITICAL', color: '#ef4444', bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300' },
}

export function getRiskMeta(level) {
  return RISK_LEVELS[level] || RISK_LEVELS.MEDIUM
}

export function getRiskColor(score) {
  const rounded = Math.round(score)
  if (rounded <= 30) return '#22c55e'
  if (rounded <= 60) return '#eab308'
  if (rounded <= 80) return '#f97316'
  return '#ef4444'
}

export function classifyRisk(score) {
  const rounded = Math.round(score)
  if (rounded <= 30) return 'LOW'
  if (rounded <= 60) return 'MEDIUM'
  if (rounded <= 80) return 'HIGH'
  return 'CRITICAL'
}

// ── Formatting helpers ───────────────────────────────────────────────────────

export function formatScore(score) {
  return typeof score === 'number' ? Math.round(score) : '—'
}

export function formatPercent(value) {
  return `${Math.round(value)}%`
}

export function formatTemp(t) {
  return `${t?.toFixed(1) ?? '—'}°C`
}

export function formatRainfall(r) {
  return `${r?.toFixed(1) ?? '—'} mm`
}

export function formatCurrency(v) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(v)
}

// ── Chart data helpers ───────────────────────────────────────────────────────

export function breakdownToChartData(breakdown) {
  if (!breakdown) return []
  const order = ['market', 'pest', 'production', 'soil', 'weather']
  const icons = {
    weather: '🌦️', pest: '🐛', soil: '🌱', market: '📈', production: '🌾'
  }
  
  return order.map(key => {
    if (breakdown[key] !== undefined) {
      return {
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: Math.round(breakdown[key]),
        color: getCategoryColor(key),
        icon: icons[key] || '📊',
      }
    }
    return null
  }).filter(Boolean)
}

export function getCategoryColor(category) {
  const colors = {
    weather:    '#3b82f6',
    pest:       '#f97316',
    soil:       '#84cc16',
    market:     '#a855f7',
    production: '#22c55e',
  }
  return colors[category] || '#6b7280'
}

export function getCategoryIcon(category) {
  const icons = {
    weather:    '🌦️',
    pest:       '🐛',
    soil:       '🌱',
    market:     '📈',
    production: '🌾',
  }
  return icons[category] || '📊'
}

// ── Priority helpers ─────────────────────────────────────────────────────────

export function getPriorityMeta(priority) {
  const map = {
    critical: { color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',    dot: 'bg-red-500'    },
    high:     { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' },
    medium:   { color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-500' },
    low:      { color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200',  dot: 'bg-green-500'  },
  }
  return map[priority] || map.medium
}
