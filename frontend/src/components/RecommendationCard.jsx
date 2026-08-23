import React from 'react'
import { getPriorityMeta } from '../utils/riskUtils'
import { AlertCircle, Info, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

const PriorityIcon = ({ priority }) => {
  const icons = {
    critical: <AlertCircle className="w-4 h-4" />,
    high:     <AlertTriangle className="w-4 h-4" />,
    medium:   <Info className="w-4 h-4" />,
    low:      <CheckCircle className="w-4 h-4" />,
  }
  return icons[priority] || icons.medium
}

export default function RecommendationCard({ rec, index }) {
  const [expanded, setExpanded] = React.useState(index < 3)
  const meta = getPriorityMeta(rec.priority)

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200 cursor-pointer
                  ${meta.border} ${meta.bg}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 flex-shrink-0 ${meta.color}`}>
            <PriorityIcon priority={rec.priority} />
          </span>
          <div>
            <p className={`font-semibold text-sm ${meta.color}`}>{rec.title}</p>
            {expanded && (
              <p className="text-sm text-gray-600 mt-1.5 leading-relaxed animate-fade-in">
                {rec.detail}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${meta.bg} ${meta.color} border ${meta.border}`}>
            {rec.priority}
          </span>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />
          }
        </div>
      </div>
    </div>
  )
}
