import React, { useState } from 'react'
import { Lightbulb, Filter, RefreshCw } from 'lucide-react'
import apiService from '../services/api'
import RecommendationCard from '../components/RecommendationCard'
import Loading from '../components/Loading'

const PRIORITY_OPTIONS = ['All', 'critical', 'high', 'medium', 'low']
const CATEGORY_OPTIONS = ['All', 'weather', 'pest', 'soil', 'market', 'production']

// Default set of recommendations (shown without API)
const DEFAULT_RECS = [
  { id:'w1', title:'Monitor Drainage Systems',     detail:'Inspect field drainage and ensure proper water runoff.',              priority:'high',     category:'weather' },
  { id:'p1', title:'Intensify Field Inspections',  detail:'Scout fields twice weekly for pest activity.',                        priority:'high',     category:'pest' },
  { id:'s1', title:'Conduct Soil Testing',         detail:'Test NPK, pH, and organic carbon before next sowing.',               priority:'high',     category:'soil' },
  { id:'m1', title:'Monitor Mandi Prices Daily',   detail:'Use AgMarkNet for real-time price comparisons.',                     priority:'medium',   category:'market' },
  { id:'pr1',title:'Switch to High-Yield Varieties',detail:'Consult ICAR for recommended HYV seeds for your region.',           priority:'medium',   category:'production' },
  { id:'p2', title:'Apply IPM Practices',          detail:'Combine biological and chemical controls for pest management.',       priority:'medium',   category:'pest' },
  { id:'s2', title:'Correct Soil pH Imbalance',    detail:'Apply lime for acidic soils or sulfur for alkaline conditions.',     priority:'medium',   category:'soil' },
  { id:'m2', title:'Consider Cold Storage',        detail:'If prices are low, use NWR-backed storage to sell at better time.',  priority:'low',      category:'market' },
  { id:'w2', title:'Track Weather Forecasts Daily',detail:'Use IMD forecasts to plan irrigation and harvesting activities.',    priority:'low',      category:'weather' },
  { id:'pr2',title:'Optimise Sowing Schedule',     detail:'Use crop calendars to plant within optimal windows.',                priority:'low',      category:'production' },
]

export default function Recommendations() {
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
      const res = await apiService.getRecommendations({
        weather: 65, pest: 50, soil: 45, market: 35, production: 55
      }, 'HIGH')
      if (res?.recommendations?.length) setRecs(res.recommendations)
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
          <h1 className="text-2xl font-bold text-gray-900">Recommendations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Data-driven mitigation strategies ranked by priority.
          </p>
        </div>
        <button onClick={refresh} disabled={loading} className="btn-ghost flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter className="w-4 h-4" /> Filters:
          </div>

          {/* Priority */}
          <div>
            <span className="text-xs font-semibold text-gray-400 mr-2">Priority</span>
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
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <span className="text-xs font-semibold text-gray-400 mr-2">Category</span>
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
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-gray-400 ml-auto">
            {filtered.length} recommendations
          </span>
        </div>
      </div>

      {loading && <Loading message="Loading recommendations…" />}

      {!loading && (
        <div className="space-y-3">
          {filtered.length > 0 ? filtered.map((rec, idx) => (
            <RecommendationCard key={rec.id || idx} rec={rec} index={idx} />
          )) : (
            <div className="card text-center py-12 text-gray-400">
              <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No recommendations match the selected filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
