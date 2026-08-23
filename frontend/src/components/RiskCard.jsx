import React from 'react'
import { getRiskMeta, classifyRisk } from '../utils/riskUtils'

export default function RiskCard({ title, score, icon: Icon, category, compact = false }) {
  const level = classifyRisk(score)
  const meta  = getRiskMeta(level)

  const progressWidth = `${Math.min(100, Math.max(0, score))}%`

  return (
    <div className={`card card-hover animate-fade-in ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${meta.bg}`}>
              {typeof Icon === 'string' ? Icon : <Icon className={`w-5 h-5 ${meta.text}`} />}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{category || 'Risk'}</p>
            <h3 className={`font-semibold text-gray-800 ${compact ? 'text-sm' : 'text-base'}`}>{title}</h3>
          </div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.bg} ${meta.text}`}>
          {level}
        </span>
      </div>

      <div className="flex items-end justify-between mb-3">
        <span
          className="font-bold tabular-nums animate-count-up"
          style={{ fontSize: compact ? '2rem' : '2.5rem', color: meta.color, lineHeight: 1 }}
        >
          {Math.round(score)}
        </span>
        <span className="text-gray-400 text-sm font-medium mb-1">/ 100</span>
      </div>

      {/* Progress bar */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: progressWidth, backgroundColor: meta.color }}
        />
      </div>
    </div>
  )
}
