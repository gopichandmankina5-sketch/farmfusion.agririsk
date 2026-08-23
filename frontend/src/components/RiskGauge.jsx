import React, { useEffect, useRef } from 'react'
import { getRiskColor, classifyRisk } from '../utils/riskUtils'

export default function RiskGauge({ score = 0, breakdown, size = 220 }) {
  const level = classifyRisk(score)
  const color = getRiskColor(score)

  // SVG arc gauge parameters
  const cx = size / 2
  const cy = size / 2
  const r  = (size / 2) - 22
  const strokeWidth = 14

  // We draw a 240° arc (from 150° to 390° = -210° to 30° in standard math)
  const totalAngle = 240
  const startAngle = 150
  const circumference = 2 * Math.PI * r
  const arcLength    = (totalAngle / 360) * circumference
  const fillLength   = (Math.min(100, Math.max(0, score)) / 100) * arcLength

  // Convert angle to SVG coords
  const toRad = (deg) => (deg * Math.PI) / 180
  const arcX  = (angle) => cx + r * Math.cos(toRad(angle))
  const arcY  = (angle) => cy + r * Math.sin(toRad(angle))

  const describeArc = (startDeg, endDeg) => {
    const start = { x: arcX(startDeg), y: arcY(startDeg) }
    const end   = { x: arcX(endDeg),   y: arcY(endDeg) }
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`
  }

  const endAngle  = startAngle + totalAngle
  const fillAngle = startAngle + (score / 100) * totalAngle

  const levelMeta = {
    LOW:      { label: 'Low Risk',      sub: 'Situation normal' },
    MEDIUM:   { label: 'Medium Risk',   sub: 'Monitor closely' },
    HIGH:     { label: 'High Risk',     sub: 'Take action soon' },
    CRITICAL: { label: 'Critical Risk', sub: 'Immediate action' },
  }

  let highestFactorsStr = ''
  if (breakdown) {
    const sorted = Object.entries(breakdown).sort((a, b) => b[1] - a[1])
    if (sorted.length >= 2) {
      const f1 = sorted[0][0]
      const f2 = sorted[1][0]
      const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1)
      highestFactorsStr = `Risk is primarily influenced by ${capitalize(f1)} and ${capitalize(f2)} factors.`
    }
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
        {/* Track arc */}
        <path
          d={describeArc(startAngle, endAngle)}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Fill arc */}
        <path
          d={describeArc(startAngle, fillAngle)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
        />

        {/* Score number */}
        <text
          x={cx} y={cy - 8}
          textAnchor="middle"
          fontSize={size * 0.22}
          fontWeight="800"
          fill={color}
          fontFamily="Inter, sans-serif"
        >
          {Math.round(score)}
        </text>

        {/* /100 */}
        <text
          x={cx} y={cy + 18}
          textAnchor="middle"
          fontSize={size * 0.07}
          fill="#9ca3af"
          fontFamily="Inter, sans-serif"
          fontWeight="500"
        >
          out of 100
        </text>

        {/* Level text */}
        <text
          x={cx} y={cy + size * 0.28}
          textAnchor="middle"
          fontSize={size * 0.085}
          fontWeight="700"
          fill={color}
          fontFamily="Inter, sans-serif"
          letterSpacing="-0.5"
        >
          {level}
        </text>
      </svg>

      {/* Labels */}
      <div className="text-center mt-1">
        <p className="font-bold text-gray-800" style={{ color }}>
          {levelMeta[level]?.label}
        </p>
        <p className="text-sm text-gray-500 mt-1 max-w-[200px] leading-snug mx-auto">
          {highestFactorsStr || levelMeta[level]?.sub}
        </p>
      </div>
    </div>
  )
}
