import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Search, ChevronDown, Loader2, AlertCircle, ChevronRight } from 'lucide-react'

import apiService from '../services/api'
import RiskGauge from '../components/RiskGauge'
import RiskCard from '../components/RiskCard'
import RiskBreakdown from '../components/RiskBreakdown'
import RiskFactors from '../components/RiskFactors'
import WeatherCard from '../components/WeatherCard'
import RecommendationCard from '../components/RecommendationCard'
import Loading from '../components/Loading'
import SeasonalCalendar from '../components/SeasonalCalendar'
import { useLanguage } from '../context/LanguageContext'
import { translateValue } from '../utils/translations'
import { getLocalizedName } from '../utils/localization'
import districtTranslations, { translateDistrict } from '../i18n/districtTranslations'
import { getAgricultureList, translateAgriculture } from '../i18n/agricultureTranslations'
import { getStateList } from '../i18n/stateTranslations'
import { districtsByState } from '../data/indiaData'
import { generateRecommendations } from '../utils/recommendationEngine'

import SearchableSelect from '../components/SearchableSelect'
import indiaLocations from '../data/india_locations.json'

let inMemoryRiskState = null;

export default function RiskAnalysis() {
  const { t, language } = useLanguage()
  const [form, setForm] = useState(() => inMemoryRiskState?.payload || { state: '', district: '', crop: '', season: '' })
  const [result, setResult] = useState(() => inMemoryRiskState?.result || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [districts, setDistricts] = useState(() => {
    if (inMemoryRiskState?.payload?.state) {
      return districtsByState[inMemoryRiskState.payload.state] || []
    }
    return []
  })
  
  useEffect(() => {
    // Cleanup any lingering localStorage from previous versions
    localStorage.removeItem('agririsk_last_analysis');
  }, []);
  
  // Fetch districts when state changes
  const [districtsLoading, setDistrictsLoading] = useState(false)
  const [districtError, setDistrictError] = useState(null)

  // Fetch districts when state changes
  useEffect(() => {
    if (!form.state) {
      setDistricts([]);
      if (form.district) handleChange('district', '');
      return;
    }

    let active = true;
    const loadDistricts = async () => {
      setDistrictsLoading(true);
      setDistrictError("");
      
      const localDistricts = districtsByState[form.state] || [];
      
      try {
        // Try the API using canonical state name if available
        const stateName = getStateList().find(s => s.id === form.state)?.names.en || form.state;
        const response = await fetch(`http://localhost:5000/api/meta/states?state=${stateName}`);
        
        if (!response.ok) throw new Error('API failed');
        const fetchedDistricts = await response.json();
        
        if (!active) return;
        
        if (Array.isArray(fetchedDistricts) && fetchedDistricts.length > 0) {
          // Process API districts
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
            setDistrictsLoading(false);
            if (form.district && !normalizedDistricts.some(d => d.id === form.district)) {
              handleChange('district', '');
            }
            return;
          }
        }
      } catch (err) {
        // Silently fail to local districts below
      }

      if (!active) return;
      
      // Fallback securely to local districts
      setDistricts(localDistricts);
      setDistrictsLoading(false);
      
      if (form.district && !localDistricts.some(d => d.id === form.district)) {
        handleChange('district', '');
      }
    };

    loadDistricts();

    return () => { active = false; };
  }, [form.state]);

  const handleChange = (field, value) => {
    setForm(f => ({
      ...f, [field]: value,
      ...(field === 'state' ? { district: '' } : {})
    }))
  }

  useEffect(() => {
    window.__AGRIRISK_FORM_CONTROLS__ = {
      handleChange,
      handleAnalyze: () => {
        const btn = document.getElementById('analyze-btn');
        if (btn) btn.click();
      },
      form,
      districts: districts.map(d => d.id)
    };
    return () => {
      delete window.__AGRIRISK_FORM_CONTROLS__;
    };
  }, [form, districts]);

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
      inMemoryRiskState = {
        payload: form,
        result: data
      }
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
            <div className="z-[60]">
              <SearchableSelect
                label={t('state')}
                value={form.state}
                options={getStateList()}
                onChange={val => handleChange('state', val)}
                placeholder={t('select_state')}
                type="state"
              />
            </div>

            <div className="z-50">
              {districtsLoading ? (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">{t('district')}</label>
                  <div className="h-10 border border-gray-200 rounded-lg flex items-center px-3 bg-gray-50">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {getLocalizedName({ names: { en: "Loading districts...", hi: "जिले लोड हो रहे हैं...", te: "జిల్లాలను లోడ్ చేస్తోంది...", ta: "மாவட்டங்களை ஏற்றுகிறது..." } }, language)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <SearchableSelect
                    label={t('district')}
                    value={form.district}
                    options={districts}
                    onChange={val => handleChange('district', val)}
                    placeholder={form.state ? t('select_district') : t('select_state_first')}
                    disabled={!form.state || districts.length === 0}
                  />
                  {districtError && (
                <p className="mt-1.5 text-xs font-medium text-orange-600 flex items-center">
                  <span className="w-1 h-1 rounded-full bg-orange-600 mr-1.5 animate-pulse"></span>
                  {getLocalizedName({ names: { en: "Using local district data", hi: "स्थानीय जिला डेटा का उपयोग", te: "స్థానిక జిల్లా డేటాను ఉపయోగిస్తోంది", ta: "உள்ளூர் மாவட்ட தரவைப் பயன்படுத்துதல்" } }, language)}
                </p>
              )}
                </div>
              )}
            </div>

            {/* Crop */}
            <div className="z-40">
              <SearchableSelect
                label={t('crop')}
                value={form.crop}
                options={getAgricultureList('crop')}
                onChange={val => handleChange('crop', val)}
                placeholder={t('select_crop')}
                type="crop"
              />
            </div>

            {/* Season */}
            <div className="z-30">
              <SearchableSelect
                label={t('season')}
                value={form.season}
                options={getAgricultureList('season')}
                onChange={val => handleChange('season', val)}
                placeholder={t('select_season')}
                type="season"
              />
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
                                                 'bg-agri-50 border-agri-200'}`}>
            <div>
              <p className="text-sm font-medium text-gray-500">
                📍 {translateDistrict(result.district, language)}, {translateDistrict(result.state, language)} · {translateAgriculture('crop', result.crop, language)} · {translateAgriculture('season', result.season, language)}
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                {t('risk_level')}:&nbsp;
                <span className={
                  result.risk_level === 'CRITICAL' ? 'text-red-600' :
                  result.risk_level === 'HIGH'     ? 'text-orange-600' :
                  result.risk_level === 'MEDIUM'   ? 'text-yellow-600' :
                                                     'text-agri-600'
                }>
                  {translateValue(result.risk_level, language)}
                </span>
              </h2>
            </div>
            <div className="text-center">
              <p className="text-5xl font-extrabold" style={{
                color: result.risk_level === 'CRITICAL' ? '#dc2626' :
                       result.risk_level === 'HIGH'     ? '#ea580c' :
                       result.risk_level === 'MEDIUM'   ? '#ca8a04' : '#C65A28'
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

          {/* Seasonal Risk Calendar */}
          <SeasonalCalendar outlook={result.seasonal_outlook} />

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
              {t('recommendations')} - {translateAgriculture('crop', result.crop, language)}
            </h3>
            <div className="space-y-3">
              {generateRecommendations(
                result.breakdown,
                result.risk_level,
                form.crop,
                form.state,
                form.district,
                form.season
              ).map((rec, idx) => (
                <RecommendationCard key={rec.id || idx} rec={rec} index={idx} />
              ))}
            </div>
          </div>

          {/* Decision Simulator CTA */}
          <div className="mt-8 bg-gradient-to-br from-agri-50 to-agri-100 rounded-2xl p-6 border border-agri-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
             <div className="relative z-10 flex-1">
               <h3 className="text-xl font-bold text-agri-900 mb-2">{t('explore_what_if')}</h3>
               <p className="text-agri-800/80 text-sm">{t('what_if_desc')}</p>
             </div>
             <Link to="/decision-simulator" onClick={() => localStorage.setItem('agririsk_last_scenario', JSON.stringify(form))} className="relative z-10 shrink-0 bg-agri-700 hover:bg-agri-800 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow flex items-center gap-2">
                {t('open_decision_simulator')} <ChevronRight className="w-4 h-4" />
             </Link>
          </div>
        </div>
      )}
    </div>
  )
}
