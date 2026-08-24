import React from 'react'
import { getPriorityMeta } from '../utils/riskUtils'
import { AlertCircle, Info, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { translateValue } from '../utils/translations'
import { recommendationTranslations } from '../utils/recommendationTranslations'

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
  const { language } = useLanguage()
  const [expanded, setExpanded] = React.useState(index < 3)
  const meta = getPriorityMeta(rec.priority)
  
  const translatedTitle = typeof rec.title === 'string' ? rec.title : (rec.title?.[language] || rec.title?.['en'] || '');
  const translatedDetail = typeof rec.description === 'string' ? rec.description : (rec.description?.[language] || rec.description?.['en'] || '');

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
            <p className={`font-semibold text-sm ${meta.color}`}>{translatedTitle}</p>
            {expanded && (
              <p className="text-sm text-gray-600 mt-1.5 leading-relaxed animate-fade-in">
                {translatedDetail}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${meta.bg} ${meta.color} border ${meta.border}`}>
            {translateValue(rec.priority, language)}
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
