import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { Activity, TrendingUp, RefreshCw, AlertTriangle } from 'lucide-react'

import apiService from '../services/api'
import RiskGauge from '../components/RiskGauge'
import RiskCard from '../components/RiskCard'
import RiskBreakdown from '../components/RiskBreakdown'
import RiskFactors from '../components/RiskFactors'
import WeatherCard from '../components/WeatherCard'
import RegionalMap from '../components/RegionalMap'
import RecommendationCard from '../components/RecommendationCard'
import Loading from '../components/Loading'
import { useLanguage } from '../context/LanguageContext'
import { translateValue } from '../utils/translations'

// Default example data shown on dashboard load
const DEFAULT_PAYLOAD = {
  state: 'Tamil Nadu', district: 'Madurai', crop: 'Rice', season: 'Kharif'
}

export default function Dashboard() {
  const { t, language } = useLanguage()
  const [payload,      setPayload]      = useState(DEFAULT_PAYLOAD)
  const [data,         setData]         = useState(null)
  const [regionalData, setRegionalData] = useState([])
  const [weatherData,  setWeatherData]  = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [riskResult, regionalResult] = await Promise.all([
        apiService.analyzeRisk(payload),
        apiService.getRegionalRisk()
      ])
      setData(riskResult)
      setRegionalData(regionalResult.data || [])
      
      // Merge weather data into a custom state
      if (riskResult.weather_data) {
        setWeatherData({
          ...riskResult.weather_data, 
          state: riskResult.state, 
          district: riskResult.district
        })
      } else {
        setWeatherData(null)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [payload])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  if (loading || !data) return <div className="p-8"><Loading /></div>

  if (error) return (
    <div className="p-8 text-center animate-fade-in">
      <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
      <h3 className="font-semibold text-gray-800 mb-2">{t('dashboard_loading_error')}</h3>
      <p className="text-gray-500 text-sm mb-5">{error}</p>
      <p className="text-sm text-gray-400 mb-4">
        {t('ensure_backend')}
      </p>
      <button onClick={fetchDashboard} className="btn-primary">
        <RefreshCw className="w-4 h-4" /> {t('retry')}
      </button>
    </div>
  )

  const { risk_score, risk_level, breakdown, factors, recommendations, trend,
          soil_data, pest_data, market_data } = data

  const trendChartData = (trend || []).map(t => ({ ...t, fill: '#22c55e' }))

  const handleLocationChange = (e) => {
    const val = e.target.value;
    if (val === 'Madurai') setPayload({ ...payload, state: 'Tamil Nadu', district: 'Madurai' });
    if (val === 'Chennai') setPayload({ ...payload, state: 'Tamil Nadu', district: 'Chennai' });
    if (val === 'Coimbatore') setPayload({ ...payload, state: 'Tamil Nadu', district: 'Coimbatore' });
    if (val === 'Vijayawada') setPayload({ ...payload, state: 'Andhra Pradesh', district: 'Vijayawada' });
  }

  return (
    <div className="p-5 space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('overview')} {translateValue(payload.crop, language)} · {translateValue(payload.district, language)}, {translateValue(payload.state, language)} · {translateValue(payload.season, language)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={payload.district} 
            onChange={handleLocationChange}
            className="form-select text-sm py-2 pl-3 pr-8 rounded-lg border-gray-200 shadow-sm"
          >
             <option value="Madurai">{translateValue('Madurai', language)}, {translateValue('Tamil Nadu', language)}</option>
             <option value="Chennai">{translateValue('Chennai', language)}, {translateValue('Tamil Nadu', language)}</option>
             <option value="Coimbatore">{translateValue('Coimbatore', language)}, {translateValue('Tamil Nadu', language)}</option>
             <option value="Vijayawada">{translateValue('Vijayawada', language)}, {translateValue('Andhra Pradesh', language)}</option>
          </select>
          <button onClick={fetchDashboard} className="btn-ghost flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> {t('refresh')}
          </button>
          <Link to="/risk-analysis" className="btn-primary text-sm py-2 px-4">
            <Activity className="w-4 h-4" /> {t('new_analysis')}
          </Link>
        </div>
      </div>

      {/* Top row: Gauge + Breakdown + Weather */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Overall Risk Gauge */}
        <div className="card flex flex-col items-center justify-center py-6">
          <h3 className="font-semibold text-gray-800 mb-5">{t('overall_risk_score')}</h3>
          <RiskGauge score={risk_score} breakdown={breakdown} size={200} />
        </div>

        {/* Risk Breakdown */}
        <RiskBreakdown breakdown={breakdown} />

        {/* Weather Card */}
        <WeatherCard data={weatherData} />
      </div>

      {/* Risk Category Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <RiskCard title="Weather"    score={breakdown?.weather    || 0} icon="🌦️" category="Weather"    compact />
        <RiskCard title="Pest"       score={breakdown?.pest       || 0} icon="🐛" category="Pest"       compact />
        <RiskCard title="Soil"       score={breakdown?.soil       || 0} icon="🌱" category="Soil"       compact />
        <RiskCard title="Market"     score={breakdown?.market     || 0} icon="📈" category="Market"     compact />
        <RiskCard title="Production" score={breakdown?.production || 0} icon="🌾" category="Production" compact />
      </div>

      {/* Risk Trend + Factors */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Historical Trend */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-800">{translateValue('Risk Trend (6 months)', language)}</h3>
            <TrendingUp className="w-4 h-4 text-agri-600" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendChartData}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                formatter={(v) => [`${v}`, translateValue('Risk Score', language)]}
              />
              <Area type="monotone" dataKey="score" stroke="#16a34a" strokeWidth={2.5}
                    fill="url(#riskGrad)" dot={{ r: 4, fill: '#16a34a', strokeWidth: 2, stroke: 'white' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Factors */}
        <RiskFactors factors={factors || []} />
      </div>

      {/* Regional Map */}
      <RegionalMap data={regionalData} />

      {/* Recommendations */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-800">{t('recommendations')}</h3>
          <Link to="/recommendations" className="text-sm text-agri-600 hover:underline font-medium">
            {t('view_all')}
          </Link>
        </div>
        <div className="space-y-3">
          {(recommendations || []).slice(0, 5).map((rec, idx) => (
            <RecommendationCard key={rec.id || idx} rec={rec} index={idx} />
          ))}
        </div>
      </div>
    </div>
  )
}
