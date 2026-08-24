import React, { useState, useEffect } from 'react'
import { Map, AlertTriangle, RefreshCw } from 'lucide-react'
import apiService from '../services/api'
import RegionalMap from '../components/RegionalMap'
import Loading from '../components/Loading'
import { useLanguage } from '../context/LanguageContext'
import { translateValue } from '../utils/translations'

export default function RegionalRisk() {
  const { t, language } = useLanguage()
  const [data,     setData]     = useState([])
  const [selected, setSelected] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const fetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiService.getRegionalRisk()
      setData(res.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const riskCounts = data.reduce((acc, d) => {
    const lvl = d.risk_level || 'MEDIUM'
    acc[lvl] = (acc[lvl] || 0) + 1
    return acc
  }, {})

  const levelMeta = {
    LOW:      { color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200' },
    MEDIUM:   { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    HIGH:     { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    CRITICAL: { color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200' },
  }

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('regional_risk_map')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('click_region_marker')}
          </p>
        </div>
        <button onClick={fetch} className="btn-ghost flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> {t('refresh')}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['LOW','MEDIUM','HIGH','CRITICAL'].map(lvl => {
          const m = levelMeta[lvl]
          return (
            <div key={lvl} className={`rounded-2xl border p-4 ${m.bg} ${m.border}`}>
              <p className={`text-2xl font-bold ${m.color}`}>{riskCounts[lvl] || 0}</p>
              <p className={`text-xs font-semibold uppercase tracking-wide ${m.color} mt-0.5`}>
                {translateValue(lvl, language)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{t('districts')}</p>
            </div>
          )
        })}
      </div>

      {loading && <Loading message={t('loading_regional')} />}
      {error && (
        <div className="card text-center py-12">
          <AlertTriangle className="w-10 h-10 text-orange-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">{error}</p>
          <button onClick={fetch} className="btn-primary mt-4 mx-auto inline-flex">
            <RefreshCw className="w-4 h-4" /> {t('retry')}
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Map */}
          <div className="lg:col-span-2">
            <RegionalMap data={data} onRegionClick={setSelected} />
          </div>

          {/* Selected region details */}
          <div className="space-y-4">
            {selected ? (
              <div className="card animate-fade-in">
                <h3 className="font-semibold text-gray-800 mb-4">📍 {translateValue(selected.state, language)}</h3>
                <div className={`rounded-xl p-4 mb-4 ${levelMeta[selected.level]?.bg} ${levelMeta[selected.level]?.border} border`}>
                  <p className="text-3xl font-bold" style={{
                    color: selected.level === 'CRITICAL' ? '#dc2626' :
                           selected.level === 'HIGH'     ? '#ea580c' :
                           selected.level === 'MEDIUM'   ? '#ca8a04' : '#16a34a'
                  }}>
                    {selected.score}
                  </p>
                  <p className={`text-sm font-semibold ${levelMeta[selected.level]?.color}`}>
                    {translateValue(selected.level, language)} RISK
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('districts_covered')}</span>
                    <span className="font-semibold">{selected.items?.length || 1}</span>
                  </div>
                  {selected.items?.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">{translateValue(item.district, language) || t('district')}</span>
                      <span className="font-bold text-gray-800">{Math.round(item.avg_risk_score || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card text-center py-12 text-gray-400">
                <Map className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{t('click_marker_map')}</p>
                <p className="text-sm mt-1">{t('see_district_details')}</p>
              </div>
            )}

            {/* Top risk regions */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">{t('highest_risk_districts')}</h3>
              <div className="space-y-2">
                {[...data]
                  .sort((a, b) => (b.avg_risk_score || 0) - (a.avg_risk_score || 0))
                  .slice(0, 8)
                  .map((d, i) => {
                    const m = levelMeta[d.risk_level] || levelMeta.MEDIUM
                    return (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-gray-700">{translateValue(d.district, language)}</p>
                          <p className="text-xs text-gray-400">{translateValue(d.state, language)}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${m.color}`}>{Math.round(d.avg_risk_score || 0)}</p>
                          <p className={`text-xs font-semibold ${m.color}`}>{translateValue(d.risk_level, language)}</p>
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
