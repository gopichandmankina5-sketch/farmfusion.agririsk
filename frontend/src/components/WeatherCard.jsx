import React from 'react'
import { Thermometer, Droplets, Wind, AlertTriangle, Cloud, Umbrella } from 'lucide-react'

export default function WeatherCard({ data }) {
  if (!data) {
    return (
      <div className="card animate-fade-in flex flex-col items-center justify-center py-10 text-center">
        <AlertTriangle className="w-8 h-8 text-orange-400 mb-3" />
        <h3 className="font-semibold text-gray-800">Live weather unavailable</h3>
        <p className="text-sm text-gray-500 mt-1">Last updated: unavailable</p>
      </div>
    )
  }

  const temp = (data.avg_temperature ?? data.temperature)?.toFixed(1) ?? '—'
  const rain = (data.avg_rainfall ?? data.rainfall)?.toFixed(1) ?? '0'
  const pop = data.precipitation_probability !== null && data.precipitation_probability !== undefined 
                ? `${data.precipitation_probability}%` : 'Not available'
  const hum = (data.avg_humidity ?? data.humidity)?.toFixed(1) ?? '—'
  const windVal = data.avg_wind_speed ?? data.wind_speed
  const windStr = windVal !== null && windVal !== undefined ? windVal.toFixed(1) : 'Not available'
  const windUnit = windVal !== null && windVal !== undefined ? 'km/h' : ''
  
  const cityName = data.location ? data.location.split(',')[0] : 'Location'
  const timeStr = data.timestamp && data.timestamp.includes(' ') 
    ? data.timestamp.split(' ')[1].slice(0,5) 
    : (data.timestamp || 'Unknown')
  
  return (
    <div className="card animate-fade-in flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">
          Weather — {cityName}
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
            {data.description || data.condition || 'Moderate'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1 text-blue-600">
            <Cloud className="w-4 h-4" />
            <span className="text-xs font-semibold">Rainfall</span>
          </div>
          <p className="text-lg font-bold text-blue-700">{rain} mm</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1 text-indigo-600">
            <Umbrella className="w-4 h-4" />
            <span className="text-xs font-semibold">Precipitation</span>
          </div>
          <p className="text-lg font-bold text-indigo-700">{pop}</p>
        </div>
        <div className="bg-cyan-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1 text-cyan-600">
            <Droplets className="w-4 h-4" />
            <span className="text-xs font-semibold">Humidity</span>
          </div>
          <p className="text-lg font-bold text-cyan-700">{hum}%</p>
        </div>
        <div className="bg-teal-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1 text-teal-600">
            <Wind className="w-4 h-4" />
            <span className="text-xs font-semibold">Wind</span>
          </div>
          <p className="text-lg font-bold text-teal-700">
            {windStr} {windUnit && <span className="text-sm font-semibold">{windUnit}</span>}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-2 border-t border-gray-100 text-center">
        <p className="text-[11px] text-gray-400">
          Updated: {timeStr}
        </p>
      </div>
    </div>
  )
}
