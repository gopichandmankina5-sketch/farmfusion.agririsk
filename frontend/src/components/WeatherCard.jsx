import React from 'react'
import { Thermometer, Droplets, Wind, AlertTriangle, Cloud, Umbrella } from 'lucide-react'
import { useTranslation, useLanguage } from '../context/LanguageContext'
import { translateValue } from '../utils/translations'

export default function WeatherCard({ data }) {
  const { t, language } = useLanguage()
  
  if (!data) {
    return (
      <div className="card animate-fade-in flex flex-col items-center justify-center py-10 text-center">
        <AlertTriangle className="w-8 h-8 text-orange-400 mb-3" />
        <h3 className="font-semibold text-gray-800">{t('live_weather_unavailable') || 'Live weather unavailable'}</h3>
        <p className="text-sm text-gray-500 mt-1">Last updated: unavailable</p>
      </div>
    )
  }

  const temp = (data.avg_temperature ?? data.temperature)?.toFixed(1) ?? '—'
  const rainVal = data.avg_rainfall ?? data.rainfall
  const rain = rainVal !== null && rainVal !== undefined ? `${rainVal.toFixed(1)} mm` : 'Not available'
  const pop = data.precipitation_probability !== null && data.precipitation_probability !== undefined 
                ? `${data.precipitation_probability}%` : 'Not available'
  const hum = (data.avg_humidity ?? data.humidity)?.toFixed(1) ?? '—'
  const windVal = data.avg_wind_speed ?? data.wind_speed
  const windStr = windVal !== null && windVal !== undefined ? windVal.toFixed(1) : 'Not available'
  const windUnit = windVal !== null && windVal !== undefined ? 'km/h' : ''
  
  const locationName = data.location || 'Location'
  const formatTime = (ts) => {
    if (!ts || !ts.includes(' ')) return 'Unknown'
    const timePart = ts.split(' ')[1]
    const [h, m] = timePart.split(':')
    let hours = parseInt(h, 10)
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    return `${hours}:${m} ${ampm}`
  }
  const timeStr = formatTime(data.timestamp)
  
  const conditionStr = data.description || data.condition || 'Moderate'
  // Use local dictionary mapping first, if missing fallback to LibreTranslate
  const localTranslation = translateValue(conditionStr, language)
  const translatedCondition = localTranslation !== conditionStr ? localTranslation : useTranslation(conditionStr)
  
  return (
    <div className="card animate-fade-in flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">
          {t('weather')} — {String(locationName).split(', ').map(p => translateValue(p.trim(), language)).join(', ')}
        </h3>
        <div className="text-right flex flex-col items-end gap-1">
          <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-agri-600 bg-agri-50 px-2 py-1 rounded">
            <span className={`w-1.5 h-1.5 rounded-full ${data.is_fallback ? 'bg-orange-500' : 'bg-green-500 animate-pulse'}`}></span>
            {data.is_fallback ? 'LIVE • OPEN-METEO • FALLBACK' : 'LIVE • OPENWEATHERMAP'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6 px-2">
        <div className="text-4xl font-black text-gray-900">{temp}°C</div>
        <div>
          <div className="font-medium text-gray-700 capitalize">
            {translatedCondition}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1 text-blue-600">
            <Cloud className="w-4 h-4" />
            <span className="text-xs font-semibold">{t('rainfall')}</span>
          </div>
          <p className="text-lg font-bold text-blue-700">{rain}</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1 text-indigo-600">
            <Umbrella className="w-4 h-4" />
            <span className="text-xs font-semibold">{t('precipitation')}</span>
          </div>
          <p className="text-lg font-bold text-indigo-700">{pop}</p>
        </div>
        <div className="bg-cyan-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1 text-cyan-600">
            <Droplets className="w-4 h-4" />
            <span className="text-xs font-semibold">{t('humidity')}</span>
          </div>
          <p className="text-lg font-bold text-cyan-700">{hum}%</p>
        </div>
        <div className="bg-teal-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1 text-teal-600">
            <Wind className="w-4 h-4" />
            <span className="text-xs font-semibold">{t('wind')}</span>
          </div>
          <p className="text-lg font-bold text-teal-700">
            {windStr} {windUnit && <span className="text-sm font-semibold">{windUnit}</span>}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-2 border-t border-gray-100 text-center">
        <p className="text-[11px] text-gray-400">
          Weather observed: {timeStr}
        </p>
      </div>
    </div>
  )
}
