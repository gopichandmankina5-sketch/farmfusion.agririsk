import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Play, RefreshCw, AlertTriangle, ChevronRight, TrendingDown, TrendingUp, Minus } from 'lucide-react'

import apiService from '../services/api'
import Loading from '../components/Loading'
import SearchableSelect from '../components/SearchableSelect'
import { useLanguage } from '../context/LanguageContext'
import { translateDistrict } from '../i18n/districtTranslations'
import { translateAgriculture, getAgricultureList } from '../i18n/agricultureTranslations'
import { getLocalizedName } from '../utils/localization'
import { stateTranslations, getStateList } from '../i18n/stateTranslations'
import { districtsByState } from '../data/indiaData'
import districtTranslations from '../i18n/districtTranslations'

// Default fallback context
const DEFAULT_CONTEXT = {
  state: 'andhra_pradesh', district: 'chittoor', crop: 'rice', season: 'kharif'
}

export default function DecisionSimulator() {
  const { t, language } = useLanguage()

  const [current, setCurrent] = useState(DEFAULT_CONTEXT)
  const [scenario, setScenario] = useState({})
  
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [districts, setDistricts] = useState([])
  const [history, setHistory] = useState([])

  // Initialize from local storage or default
  useEffect(() => {
    const saved = localStorage.getItem('agririsk_last_scenario')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setCurrent(parsed)
      } catch (e) {}
    }
    const savedHistory = localStorage.getItem('agririsk_sim_history')
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)) } catch(e) {}
    }
  }, [])

  // Load districts when scenario state changes
  useEffect(() => {
    const st = scenario.state || current.state
    if (!st) {
      setDistricts([])
      return
    }
    const localDists = districtsByState[st] || []
    setDistricts(localDists)
  }, [scenario.state, current.state])

  const runSimulation = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('http://localhost:5000/api/risk/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current, scenario: { ...current, ...scenario, overrides: scenario } })
      })
      if (!res.ok) throw new Error('Simulation failed to run.')
      const result = await res.json()
      setData(result)

      // Save to history
      const newHistory = [{
        crop: scenario.crop || current.crop,
        location: scenario.district || current.district,
        before: result.comparison.overall.current,
        after: result.comparison.overall.scenario,
        change: result.comparison.overall.change
      }, ...history].slice(0, 5)
      setHistory(newHistory)
      localStorage.setItem('agririsk_sim_history', JSON.stringify(newHistory))

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [current, scenario, history])

  // Initial load
  useEffect(() => {
    if (!data && !loading && !error) {
      runSimulation()
    }
  }, [data, loading, error, runSimulation])

  const handleOverride = (key, value) => {
    setScenario(prev => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    setScenario({})
    setData(null) // trigger rerun
  }

  const applyPreset = (preset) => {
    let updates = {}
    switch (preset) {
      case 'improve_soil': updates = { nitrogen: 250, soil_moisture: 60 }; break;
      case 'heat_stress': updates = { temperature: 35, soil_moisture: 20 }; break;
      case 'heavy_rain': updates = { rainfall: 200, humidity: 85 }; break;
      case 'high_pest': updates = { pest_probability: 0.8 }; break;
      case 'market_drop': updates = { market_price: (data?.current?.market_data?.price || 2000) * 0.7 }; break;
      default: break;
    }
    setScenario(prev => ({ ...prev, ...updates }))
  }

  // Helper for rendering sliders
  const renderSlider = (label, key, min, max, unit, defaultValue) => {
    const val = scenario[key] !== undefined ? scenario[key] : defaultValue
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-gray-700">{label}</span>
          <span className="text-agri-700 font-semibold">{val} {unit}</span>
        </div>
        <input 
          type="range" min={min} max={max} 
          value={val} 
          onChange={(e) => handleOverride(key, Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-agri-600"
        />
      </div>
    )
  }

  const getChangeIcon = (change) => {
    if (change < -2) return <TrendingDown className="w-5 h-5 text-green-500" />
    if (change > 2) return <TrendingUp className="w-5 h-5 text-red-500" />
    return <Minus className="w-5 h-5 text-gray-400" />
  }
  const getChangeColor = (change) => {
    if (change < -2) return "text-green-600 bg-green-50"
    if (change > 2) return "text-red-600 bg-red-50"
    return "text-gray-600 bg-gray-50"
  }

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">Decision Simulator</h1>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r from-agri-600 to-green-400 text-white shadow-sm">AI-Powered</span>
          </div>
          <p className="text-sm text-gray-500">Explore how farming decisions could change your predicted agricultural risk.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleReset} className="btn-ghost flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Reset Scenario
          </button>
          <button onClick={runSimulation} disabled={loading} className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
            {loading ? <Loading className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            Run AI Simulation
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Controls & Presets */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Quick Scenarios</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={()=>applyPreset('improve_soil')} className="px-3 py-1.5 text-xs rounded-full bg-agri-50 text-agri-700 border border-agri-100 hover:bg-agri-100 transition-colors">🌱 Improve Soil</button>
              <button onClick={()=>applyPreset('heavy_rain')} className="px-3 py-1.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors">🌧️ Heavy Rain</button>
              <button onClick={()=>applyPreset('heat_stress')} className="px-3 py-1.5 text-xs rounded-full bg-orange-50 text-orange-700 border border-orange-100 hover:bg-orange-100 transition-colors">☀️ Heat Stress</button>
              <button onClick={()=>applyPreset('high_pest')} className="px-3 py-1.5 text-xs rounded-full bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 transition-colors">🐛 High Pest Pressure</button>
              <button onClick={()=>applyPreset('market_drop')} className="px-3 py-1.5 text-xs rounded-full bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 transition-colors">💰 Market Price Drop</button>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Build Your Scenario</h3>
            
            <div className="space-y-6">
              {/* Location / Crop overrides */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Context</h4>
                <SearchableSelect 
                  value={scenario.state || current.state} 
                  onChange={(v) => { handleOverride('state', v); handleOverride('district', ''); }} 
                  options={getStateList()} type="state" placeholder="Select State" 
                />
                <SearchableSelect 
                  value={scenario.district || current.district} 
                  onChange={(v) => handleOverride('district', v)} 
                  options={districts} type="location" placeholder="Select District" 
                  disabled={!(scenario.state || current.state) || districts.length === 0}
                />
                <SearchableSelect 
                  value={scenario.crop || current.crop} 
                  onChange={(v) => handleOverride('crop', v)} 
                  options={getAgricultureList('crop')} type="crop" placeholder="Select Crop" 
                />
              </div>

              {/* Soil */}
              {data && (
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">🌱 Soil Conditions</h4>
                  {renderSlider('Nitrogen', 'nitrogen', 0, 300, 'kg/ha', data.current.soil_data.nitrogen)}
                  {renderSlider('Soil Moisture', 'soil_moisture', 0, 100, '%', data.current.soil_data.moisture)}
                  {renderSlider('pH Level', 'soil_ph', 0, 14, '', data.current.soil_data.ph)}
                </div>
              )}

              {/* Weather */}
              {data && (
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">🌦 Weather</h4>
                  {renderSlider('Rainfall', 'rainfall', 0, 1000, 'mm', data.current.weather_data.rainfall)}
                  {renderSlider('Temperature', 'temperature', 0, 50, '°C', data.current.weather_data.temperature)}
                </div>
              )}

              {/* Market */}
              {data && (
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">💰 Market</h4>
                  {renderSlider('Market Price', 'market_price', 0, 10000, '₹/q', data.current.market_data.price)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Results & Comparisons */}
        <div className="lg:col-span-8 space-y-6">
          {loading && !data && (
            <div className="card p-12 flex flex-col items-center justify-center min-h-[400px]">
              <Loading className="w-10 h-10 text-agri-600 mb-4" />
              <p className="text-gray-500 font-medium">Running agricultural scenario through prediction pipeline...</p>
            </div>
          )}

          {!loading && data && (
            <>
              {/* Top Level Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-5 flex flex-col items-center justify-center text-center">
                  <p className="text-sm text-gray-500 font-medium mb-1">Current Risk</p>
                  <p className="text-4xl font-bold text-gray-800">{data.comparison.overall.current.toFixed(1)}</p>
                  <p className="text-xs text-gray-400 mt-2">{translateAgriculture('crop', current.crop, language)} • {translateDistrict(current.district, language)}</p>
                </div>
                
                <div className="flex items-center justify-center py-4 md:py-0">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm">
                      <ChevronRight className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className={`mt-3 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${getChangeColor(data.comparison.overall.change)}`}>
                      {getChangeIcon(data.comparison.overall.change)}
                      {data.comparison.overall.change > 0 ? '+' : ''}{data.comparison.overall.change.toFixed(1)} Points
                    </div>
                  </div>
                </div>

                <div className="card p-5 flex flex-col items-center justify-center text-center ring-2 ring-agri-100 bg-surface">
                  <p className="text-sm text-gray-500 font-medium mb-1">Simulated Risk</p>
                  <p className={`text-4xl font-bold ${data.comparison.overall.change < -2 ? 'text-green-600' : data.comparison.overall.change > 2 ? 'text-red-600' : 'text-gray-800'}`}>
                    {data.comparison.overall.scenario.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Model Prediction</p>
                </div>
              </div>

              {/* Insights */}
              <div className="card p-6 bg-gradient-to-br from-agri-900 to-agri-800 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Activity className="w-24 h-24" />
                </div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-agri-50">
                  🧠 AgriRisk Insight
                </h3>
                <div className="space-y-2 relative z-10">
                  {data.insights.map((insight, i) => (
                    <p key={i} className="text-agri-100 text-sm leading-relaxed">{insight}</p>
                  ))}
                  <p className="text-xs text-agri-300/60 mt-4 italic">
                    * Model-based recommendation. Predictions evaluate estimated risk and are not guaranteed real-world outcomes.
                  </p>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="card p-5">
                <h3 className="font-semibold text-gray-800 mb-6">What Changed?</h3>
                <div className="space-y-6">
                  {['soil', 'production', 'weather', 'market', 'pest'].map(cat => {
                    const comp = data.comparison[cat]
                    if (!comp) return null
                    
                    return (
                      <div key={cat} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700 capitalize">{cat} Risk</span>
                          <span className={`font-bold flex items-center gap-1 ${getChangeColor(comp.change)} px-2 py-0.5 rounded`}>
                            {comp.change > 0 ? '+' : ''}{comp.change.toFixed(1)}
                          </span>
                        </div>
                        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden flex">
                          {/* We show current as gray, and if scenario is lower, we show the reduction. If higher, we show addition */}
                          <div className="h-full bg-gray-300" style={{ width: `${Math.min(comp.current, comp.scenario)}%` }} />
                          {comp.change < 0 && (
                            <div className="h-full bg-green-400" style={{ width: `${Math.abs(comp.change)}%` }} />
                          )}
                          {comp.change > 0 && (
                            <div className="h-full bg-red-400" style={{ width: `${comp.change}%` }} />
                          )}
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Current: {comp.current.toFixed(1)}</span>
                          <span>Scenario: {comp.scenario.toFixed(1)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Recent Simulations</h3>
              <div className="divide-y divide-gray-100">
                {history.map((h, i) => (
                  <div key={i} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm text-gray-800 capitalize">{h.crop}</p>
                      <p className="text-xs text-gray-500 capitalize">{h.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-700">{h.before.toFixed(1)} → {h.after.toFixed(1)}</p>
                      <p className={`text-xs font-semibold ${h.change < 0 ? 'text-green-600' : h.change > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {h.change > 0 ? '+' : ''}{h.change.toFixed(1)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
