import React, { useEffect, useRef } from 'react'
import { getRiskMeta, classifyRisk, getRiskColor } from '../utils/riskUtils'
import { useLanguage } from '../context/LanguageContext'
import { translateValue } from '../utils/translations'
import { translateDistrict } from '../i18n/districtTranslations'

// State centroids for India (approximate lat/lng)
const STATE_COORDS = {
  'Tamil Nadu':     [11.1271, 78.6569],
  'Maharashtra':    [19.7515, 75.7139],
  'Punjab':         [31.1471, 75.3412],
  'Uttar Pradesh':  [26.8467, 80.9462],
  'Rajasthan':      [27.0238, 74.2179],
  'West Bengal':    [22.9868, 87.8550],
  'Karnataka':      [15.3173, 75.7139],
  'Andhra Pradesh': [15.9129, 79.7400],
  'Madhya Pradesh': [22.9734, 78.6569],
  'Gujarat':        [22.2587, 71.1924],
}

export default function RegionalMap({ data = [], onRegionClick }) {
  const { t, language } = useLanguage()
  const mapRef  = useRef(null)
  const mapInst = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let isMounted = true

    import('leaflet').then((L) => {
      if (!isMounted) return
      if (mapInst.current) return

      // Fix default icon paths
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current, {
        center:      [20.5937, 78.9629],
        zoom:        5,
        zoomControl: true,
        scrollWheelZoom: true,
      })

      // Tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      mapInst.current = map

      // Add markers
      addMarkers(L, map, data, onRegionClick, t, language)
    }).catch(console.error)

    return () => {
      isMounted = false
      if (mapInst.current) {
        mapInst.current.remove()
        mapInst.current = null
      }
    }
  }, [])

  // Update markers when data changes
  useEffect(() => {
    if (!mapInst.current) return
    import('leaflet').then((L) => {
      mapInst.current.eachLayer(layer => {
        if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
          mapInst.current.removeLayer(layer)
        }
      })
      addMarkers(L, mapInst.current, data, onRegionClick, t, language)
    })
  }, [data, language])

  return (
    <div className="card p-0 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{t('regional_risk_map') || 'Regional Risk Map'}</h3>
          <div className="flex items-center gap-3 text-xs">
            {[
              { level: 'LOW',      color: '#22c55e' },
              { level: 'MEDIUM',   color: '#eab308' },
              { level: 'HIGH',     color: '#f97316' },
              { level: 'CRITICAL', color: '#ef4444' },
            ].map(({ level, color }) => (
              <div key={level} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: color }} />
                <span className="text-gray-500 font-medium">{translateValue(level, language) || level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div ref={mapRef} style={{ height: 420 }} />
    </div>
  )
}

// riskToColor is now imported as getRiskColor

function addMarkers(L, map, data, onRegionClick, t, language) {
  // Group by state and pick aggregated score
  const stateMap = {}
  data.forEach(d => {
    const key = d.state
    if (!stateMap[key]) stateMap[key] = { scores: [], items: [] }
    stateMap[key].scores.push(d.avg_risk_score || 0)
    stateMap[key].items.push(d)
  })

  Object.entries(stateMap).forEach(([state, { scores, items }]) => {
    const coords = STATE_COORDS[state]
    if (!coords) return

    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    const level = classifyRisk(avgScore)
    const color = getRiskColor(avgScore)

    const circle = L.circleMarker(coords, {
      radius:      18,
      fillColor:   color,
      color:       'white',
      weight:      3,
      opacity:     1,
      fillOpacity: 0.9,
    }).addTo(map)

    circle.bindPopup(`
      <div style="font-family:Inter,sans-serif;min-width:180px">
        <h4 style="font-size:14px;font-weight:700;color:#1f2937;margin:0 0 8px">${translateDistrict(state, language)}</h4>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="color:#6b7280;font-size:12px">${t('avg_risk_score') || 'Avg Risk Score'}</span>
          <span style="font-weight:700;color:${color}">${avgScore}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="color:#6b7280;font-size:12px">${t('risk_level') || 'Risk Level'}</span>
          <span style="font-weight:700;color:${color}">${translateValue(level, language)}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:#6b7280;font-size:12px">${t('districts') || 'Districts'}</span>
          <span style="font-weight:600;color:#374151">${items.length}</span>
        </div>
      </div>
    `)

    // Score label on marker
    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:36px;height:36px;border-radius:50%;
        background:${color};border:3px solid white;
        display:flex;align-items:center;justify-content:center;
        font-size:11px;font-weight:700;color:white;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        font-family:Inter,sans-serif;
      ">${avgScore}</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    })

    const marker = L.marker(coords, { icon }).addTo(map)
    marker.bindPopup(circle.getPopup())

    if (onRegionClick) {
      marker.on('click', () => onRegionClick({ state, score: avgScore, level, items }))
    }
  })
}
