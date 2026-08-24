import React, { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Search, ChevronDown, Loader2, AlertCircle } from 'lucide-react'

import apiService from '../services/api'
import RiskGauge from '../components/RiskGauge'
import RiskCard from '../components/RiskCard'
import RiskBreakdown from '../components/RiskBreakdown'
import RiskFactors from '../components/RiskFactors'
import WeatherCard from '../components/WeatherCard'
import RecommendationCard from '../components/RecommendationCard'
import Loading from '../components/Loading'
import { useLanguage } from '../context/LanguageContext'
import { translateValue } from '../utils/translations'

const SEASONS  = ['Kharif', 'Rabi', 'Zaid']
const CROPS    = [
  'Rice','Wheat','Sugarcane','Cotton','Maize','Soybean','Groundnut',
  'Bajra','Jowar','Sunflower','Turmeric','Onion','Tomato','Potato','Mustard'
]
const STATES_DISTRICTS = {
  'Tamil Nadu':     ['Chennai','Madurai','Coimbatore','Salem','Tiruchirappalli','Tirunelveli','Vellore','Erode','Thoothukudi','Thanjavur'],
  'Maharashtra':    ['Mumbai','Pune','Nagpur','Nashik','Aurangabad','Solapur','Kolhapur','Amravati','Jalgaon','Latur'],
  'Punjab':         ['Amritsar','Ludhiana','Jalandhar','Patiala','Bathinda','Mohali','Firozpur','Gurdaspur','Hoshiarpur','Sangrur'],
  'Uttar Pradesh':  ['Lucknow','Kanpur','Agra','Varanasi','Prayagraj','Meerut','Ghaziabad','Bareilly','Aligarh','Moradabad'],
  'Rajasthan':      ['Jaipur','Jodhpur','Kota','Bikaner','Udaipur','Ajmer','Bhilwara','Alwar','Sikar','Bharatpur'],
  'West Bengal':    ['Kolkata','Darjeeling','Jalpaiguri','Murshidabad','Nadia','Howrah','Bardhaman','Bankura','Hooghly','Malda'],
  'Karnataka':      ['Bengaluru','Mysuru','Hubli','Mangaluru','Belagavi','Kalaburagi','Ballari','Vijayapura','Shivamogga','Tumakuru'],
  'Andhra Pradesh': ['Visakhapatnam','Vijayawada','Guntur','Tirupati','Nellore','Kurnool','Rajahmundry','Kadapa','Anantapur','Eluru'],
  'Madhya Pradesh': ['Bhopal','Indore','Gwalior','Jabalpur','Ujjain','Sagar','Rewa','Satna','Ratlam','Morena'],
  'Gujarat':        ['Ahmedabad','Surat','Vadodara','Rajkot','Gandhinagar','Bhavnagar','Jamnagar','Junagadh','Anand','Mehsana'],
}

export default function RiskAnalysis() {
  const { t, language } = useLanguage()
  const [form, setForm] = useState({ state: '', district: '', crop: '', season: '' })
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const districts = form.state ? (STATES_DISTRICTS[form.state] || []) : []

  const handleChange = (field, value) => {
    setForm(f => ({
      ...f, [field]: value,
      ...(field === 'state' ? { district: '' } : {})
    }))
  }

  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!form.state || !form.district || !form.crop || !form.season) {
      setError('Please fill all fields before analyzing.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await apiService.analyzeRisk(form)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('risk_analysis')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {t('risk_analysis_desc')}
        </p>
      </div>

      {/* ── Analysis Form ──────────────────────────────────── */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-5">{t('enter_parameters')}</h2>
        <form onSubmit={handleAnalyze}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {/* State */}
            <div>
              <label className="form-label">{t('state')} *</label>
              <div className="relative">
                <select
                  id="state-select"
                  value={form.state}
                  onChange={e => handleChange('state', e.target.value)}
                  className="form-select pr-10"
                >
                  <option value="">{t('select_state')}</option>
                  {Object.keys(STATES_DISTRICTS).map(s => (
                    <option key={s} value={s}>{translateValue(s, language)}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* District */}
            <div>
              <label className="form-label">{t('district')} *</label>
              <div className="relative">
                <select
                  id="district-select"
                  value={form.district}
                  onChange={e => handleChange('district', e.target.value)}
                  className="form-select pr-10"
                  disabled={!form.state}
                >
                  <option value="">{form.state ? t('select_district') : t('select_state_first')}</option>
                  {districts.map(d => <option key={d} value={d}>{translateValue(d, language)}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Crop */}
            <div>
              <label className="form-label">{t('crop')} *</label>
              <div className="relative">
                <select
                  id="crop-select"
                  value={form.crop}
                  onChange={e => handleChange('crop', e.target.value)}
                  className="form-select pr-10"
                >
                  <option value="">{t('select_crop')}</option>
                  {CROPS.map(c => <option key={c} value={c}>{translateValue(c, language)}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Season */}
            <div>
              <label className="form-label">{t('season')} *</label>
              <div className="relative">
                <select
                  id="season-select"
                  value={form.season}
                  onChange={e => handleChange('season', e.target.value)}
                  className="form-select pr-10"
                >
                  <option value="">{t('select_season')}</option>
                  {SEASONS.map(s => <option key={s} value={s}>{translateValue(s, language)}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 
                            rounded-xl px-4 py-3 mb-4 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            id="analyze-btn"
            type="submit"
            disabled={loading}
            className="btn-primary w-full sm:w-auto py-3.5 px-8 text-base disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> {t('analyzing')}</>
              : <><Search className="w-5 h-5" /> {t('analyze_risk')}</>
            }
          </button>
        </form>
      </div>

      {/* ── Loading ─────────────────────────────────────────── */}
      {loading && <Loading />}

      {/* ── Results ─────────────────────────────────────────── */}
      {result && !loading && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Banner */}
          <div className={`rounded-2xl p-5 border flex flex-col sm:flex-row items-center justify-between gap-4
            ${result.risk_level === 'CRITICAL' ? 'bg-red-50 border-red-200' :
              result.risk_level === 'HIGH'     ? 'bg-orange-50 border-orange-200' :
              result.risk_level === 'MEDIUM'   ? 'bg-yellow-50 border-yellow-200' :
                                                 'bg-green-50 border-green-200'}`}>
            <div>
              <p className="text-sm font-medium text-gray-500">
                📍 {translateValue(result.district, language)}, {translateValue(result.state, language)} · {translateValue(result.crop, language)} · {translateValue(result.season, language)}
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                {t('risk_level')}:&nbsp;
                <span className={
                  result.risk_level === 'CRITICAL' ? 'text-red-600' :
                  result.risk_level === 'HIGH'     ? 'text-orange-600' :
                  result.risk_level === 'MEDIUM'   ? 'text-yellow-600' :
                                                     'text-green-600'
                }>
                  {translateValue(result.risk_level, language)}
                </span>
              </h2>
            </div>
            <div className="text-center">
              <p className="text-5xl font-extrabold" style={{
                color: result.risk_level === 'CRITICAL' ? '#dc2626' :
                       result.risk_level === 'HIGH'     ? '#ea580c' :
                       result.risk_level === 'MEDIUM'   ? '#ca8a04' : '#16a34a'
              }}>
                {Math.round(result.risk_score)}
              </p>
              <p className="text-sm text-gray-500">/ 100</p>
            </div>
          </div>

          {/* Gauge + Breakdown + Weather */}
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="card flex flex-col items-center justify-center py-6">
              <h3 className="font-semibold text-gray-800 mb-4">{t('overall_risk')}</h3>
              <RiskGauge score={result.risk_score} size={200} />
            </div>
            <RiskBreakdown breakdown={result.breakdown} />
            <WeatherCard data={result.weather_data ? {
              ...result.weather_data, state: result.state, district: result.district
            } : null} />
          </div>

          {/* Risk Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <RiskCard title={t('weather')}    score={result.breakdown?.weather    || 0} icon="🌦️" category="Weather"    compact />
            <RiskCard title={t('pest')}       score={result.breakdown?.pest       || 0} icon="🐛" category="Pest"       compact />
            <RiskCard title={t('soil')}       score={result.breakdown?.soil       || 0} icon="🌱" category="Soil"       compact />
            <RiskCard title={t('market')}     score={result.breakdown?.market     || 0} icon="📈" category="Market"     compact />
            <RiskCard title={t('production')} score={result.breakdown?.production || 0} icon="🌾" category="Production" compact />
          </div>

          {/* Trend + Factors */}
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">{translateValue('Risk Trend (6 months)', language)}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={result.trend || []}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    formatter={v => [`${v}`, translateValue('Risk Score', language)]}
                  />
                  <Area type="monotone" dataKey="score" stroke="#f97316" strokeWidth={2.5}
                        fill="url(#trendGrad)"
                        dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: 'white' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <RiskFactors factors={result.factors || []} />
          </div>

          {/* Recommendations */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-5">
              {t('recommendations')} - {translateValue(result.crop, language)}
            </h3>
            <div className="space-y-3">
              {(result.recommendations || []).map((rec, idx) => (
                <RecommendationCard key={rec.id || idx} rec={rec} index={idx} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
