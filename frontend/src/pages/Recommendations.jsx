import React, { useState } from 'react'
import { Lightbulb, Filter, RefreshCw } from 'lucide-react'
import apiService from '../services/api'
import RecommendationCard from '../components/RecommendationCard'
import Loading from '../components/Loading'
import { useLanguage } from '../context/LanguageContext'
import { translateValue } from '../utils/translations'
import { generateRecommendations } from '../utils/recommendationEngine'

const PRIORITY_OPTIONS = ['All', 'critical', 'high', 'medium', 'low']
const CATEGORY_OPTIONS = ['All', 'weather', 'pest', 'soil', 'market', 'production']

// Default set of recommendations (shown without API)
const DEFAULT_RECS = generateRecommendations({
  weather: 65, pest: 50, soil: 45, market: 35, production: 55
}, 'HIGH', 'Rice', 'Tamil Nadu', 'Madurai', 'Kharif');

export default function Recommendations() {
  const { t, language } = useLanguage()
  const [recs,     setRecs]     = useState(DEFAULT_RECS)
  const [priority, setPriority] = useState('All')
  const [category, setCategory] = useState('All')
  const [loading,  setLoading]  = useState(false)

  const filtered = recs.filter(r => {
    const pMatch = priority === 'All' || r.priority === priority
    const cMatch = category === 'All' || (r.category || '') === category
    return pMatch && cMatch
  })

  const refresh = async () => {
    setLoading(true)
    try {
      // Simulate getting a new risk breakdown
      const mockBreakdown = { weather: 65, pest: 50, soil: 45, market: 35, production: 55 }
      const newRecs = generateRecommendations(mockBreakdown, 'HIGH', 'Rice', 'Tamil Nadu', 'Madurai', 'Kharif')
      setRecs(newRecs)
    } catch {
      // Keep defaults
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('recommendations')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('data_driven_mitigation')}
          </p>
        </div>
        <button onClick={refresh} disabled={loading} className="btn-ghost flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter className="w-4 h-4" /> {t('filters')}
          </div>

          {/* Priority */}
          <div>
            <span className="text-xs font-semibold text-gray-400 mr-2">{t('priority')}</span>
            <div className="inline-flex gap-1 flex-wrap">
              {PRIORITY_OPTIONS.map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors
                    ${priority === p
                      ? 'bg-agri-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {p === 'All' ? t('all') : translateValue(p, language)}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <span className="text-xs font-semibold text-gray-400 mr-2">{t('category')}</span>
            <div className="inline-flex gap-1 flex-wrap">
              {CATEGORY_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors
                    ${category === c
                      ? 'bg-agri-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {c === 'All' ? t('all') : translateValue(c, language)}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-gray-400 ml-auto">
            {filtered.length} {t('recommendations_count')}
          </span>
        </div>
      </div>

      {loading && <Loading message={t('loading_recommendations')} />}

      {!loading && (
        <div className="space-y-3">
          {filtered.length > 0 ? filtered.map((rec, idx) => (
            <RecommendationCard key={rec.id || idx} rec={rec} index={idx} />
          )) : (
            <div className="card text-center py-12 text-gray-400">
              <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{t('no_recs_match')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
