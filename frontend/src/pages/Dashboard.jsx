import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { Activity, TrendingUp, RefreshCw, AlertTriangle, ChevronRight } from 'lucide-react'

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
import { translateDistrict } from '../i18n/districtTranslations'
import { translateAgriculture } from '../i18n/agricultureTranslations'
import { getLocalizedName } from '../utils/localization'
import { stateTranslations, getStateList } from '../i18n/stateTranslations'
import districtTranslations from '../i18n/districtTranslations'
import { districtsByState } from '../data/indiaData'
import { generateRecommendations } from '../utils/recommendationEngine'
import SearchableSelect from '../components/SearchableSelect'

// Default example data shown on dashboard load
const DEFAULT_PAYLOAD = {
  state: 'tamil_nadu', district: 'madurai', crop: 'rice', season: 'kharif'
}

export default function Dashboard() {
  const { t, language } = useLanguage()
  const [payload,      setPayload]      = useState(DEFAULT_PAYLOAD)
  const [data,         setData]         = useState(null)
  const [regionalData, setRegionalData] = useState([])
  const [weatherData,  setWeatherData]  = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)

  const [districts, setDistricts] = useState([])

  // Fetch districts when state changes
  useEffect(() => {
    if (!payload.state) {
      setDistricts([]);
      return;
    }

    let active = true;
    const loadDistricts = async () => {
      const localDistricts = districtsByState[payload.state] || [];
      
      try {
        const stateName = getStateList().find(s => s.id === payload.state)?.names.en || payload.state;
        const response = await fetch(`http://localhost:5000/api/meta/states?state=${stateName}`);
        
        if (!response.ok) throw new Error('API failed');
        const fetchedDistricts = await response.json();
        
        if (!active) return;
        
        if (Array.isArray(fetchedDistricts) && fetchedDistricts.length > 0) {
          const cleanDistrictsStrings = fetchedDistricts.filter(Boolean).filter(district => {
            const name = typeof district === "string" ? district : district.name;
            if (!name) return false;
            const lowerName = name.toLowerCase();
            return (
              !lowerName.includes("error") &&
              !lowerName.includes("server") &&
              !lowerName.includes("please try") &&
              !lowerName.includes("internal") &&
              name !== 'All'
            );
          }).map(district => typeof district === "string" ? district : district.name);
          
          const uniqueDistricts = [...new Set(cleanDistrictsStrings)];
          const normalizedDistricts = uniqueDistricts.map(name => {
            const normalizedValue = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
            if (districtTranslations[normalizedValue]) return districtTranslations[normalizedValue];
            const match = Object.values(districtTranslations).find(t => t.names.en.toLowerCase() === name.toLowerCase());
            if (match) return match;
            return { id: normalizedValue, names: { en: name, hi: name, te: name, ta: name } };
          });
          
          if (normalizedDistricts.length > 0) {
            setDistricts(normalizedDistricts);
            return;
          }
        }
      } catch (err) {}

      if (!active) return;
      setDistricts(localDistricts);
    };

    loadDistricts();
    return () => { active = false; };
  }, [payload.state]);

  const fetchDashboard = useCallback(async () => {
    if (!payload.state || !payload.district || !payload.crop || !payload.season) {
      return;
    }
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

  // Only run on initial mount (or when payload is ready on first load)
  const initialFetchDone = useRef(false);
  useEffect(() => {
    if (!initialFetchDone.current && payload.state && payload.district) {
      fetchDashboard();
      initialFetchDone.current = true;
    }
  }, [payload.state, payload.district, fetchDashboard]);

  const handleStateChange = (stateId) => {
    setPayload(p => ({ ...p, state: stateId, district: '' }))
  }

  const handleDistrictChange = (districtId) => {
    setPayload(p => ({ ...p, district: districtId }))
  }

  const handleRefreshClick = () => {
    fetchDashboard();
  }

  useEffect(() => {
    window.__AGRIRISK_FORM_CONTROLS__ = {
      handleChange: (field, value) => {
        if (field === 'state') handleStateChange(value);
        if (field === 'district') handleDistrictChange(value);
      },
      handleAnalyze: fetchDashboard,
      form: payload,
      districts: districts.map(d => d.id)
    };
    return () => {
      delete window.__AGRIRISK_FORM_CONTROLS__;
    };
  }, [payload, districts, fetchDashboard]);

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

  return (
    <div className="p-5 space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('overview')} {translateAgriculture('crop', payload.crop, language)} · {translateDistrict(payload.district, language)}, {translateDistrict(payload.state, language)} · {translateAgriculture('season', payload.season, language)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            <div className="w-48">
              <SearchableSelect
                value={payload.state}
                options={getStateList()}
                onChange={handleStateChange}
                placeholder={t('select_state')}
                type="state"
              />
            </div>
            <div className="w-48">
              <SearchableSelect
                value={payload.district}
                options={districts}
                onChange={handleDistrictChange}
                placeholder={t('select_district')}
                disabled={!payload.state}
                type="location"
              />
            </div>
          </div>
          <button onClick={handleRefreshClick} className="btn-ghost flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> {t('refresh')}
          </button>
          <Link to="/risk-analysis" className="btn-primary text-sm py-2 px-4">
            <Activity className="w-4 h-4" /> {t('new_analysis')}
          </Link>
        </div>
      </div>

      {/* Decision Simulator CTA */}
      <div className="card bg-gradient-to-r from-agri-900 to-agri-800 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10">
           <Activity className="w-24 h-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
             <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-agri-900">NEW</span>
             <h3 className="font-bold text-lg text-white">Decision Simulator</h3>
          </div>
          <p className="text-agri-100 text-sm">Not sure what decision is best? Try different farming conditions and compare predicted risk before making a decision.</p>
        </div>
        <Link to="/decision-simulator" className="relative z-10 shrink-0 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 backdrop-blur-sm">
          Open Decision Simulator <ChevronRight className="w-4 h-4" />
        </Link>
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
          {generateRecommendations(breakdown, risk_level, payload.crop, payload.state, payload.district, payload.season).slice(0, 5).map((rec, idx) => (
            <RecommendationCard key={rec.id || idx} rec={rec} index={idx} />
          ))}
        </div>
      </div>
    </div>
  )
}
