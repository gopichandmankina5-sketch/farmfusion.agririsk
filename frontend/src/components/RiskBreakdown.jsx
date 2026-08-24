import React from 'react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { getCategoryColor, breakdownToChartData } from '../utils/riskUtils'
import { useLanguage } from '../context/LanguageContext'

const RADIAN = Math.PI / 180

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
          fontSize={11} fontWeight="700">
      {Math.round(percent * 100)}%
    </text>
  )
}

const CustomTooltip = ({ active, payload, totalScore }) => {
  if (active && payload && payload.length) {
    const { name, value, color } = payload[0].payload
    const contribution = totalScore > 0 ? ((value / totalScore) * 100).toFixed(1) : 0
    return (
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-sm">
        <p className="font-bold mb-1" style={{ color }}>{name}</p>
        <p className="text-gray-600 mb-0.5">Score: <span className="font-semibold text-gray-800">{Math.round(value)}</span></p>
        <p className="text-gray-600">Contribution: <span className="font-semibold text-gray-800">{contribution}%</span></p>
      </div>
    )
  }
  return null
}

export default function RiskBreakdown({ breakdown }) {
  const { t } = useLanguage()
  if (!breakdown) return null

  const chartData = breakdownToChartData(breakdown)
  const totalScore = chartData.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <div className="card animate-fade-in">
      <h3 className="font-semibold text-gray-800 mb-6">{t('risk_breakdown')}</h3>

      {/* Donut Chart */}
      <div className="flex justify-center mb-6">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={renderCustomizedLabel}
            >
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} stroke="white" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip totalScore={totalScore} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend + bars */}
      <div className="space-y-3">
        {chartData.map(({ name, value, color, icon }) => (
          <div key={name}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">{icon}</span>
                <span className="text-sm font-medium text-gray-700">{t(name.toLowerCase())}</span>
              </div>
              <span className="text-sm font-bold" style={{ color }}>
                {Math.round(value)}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${value}%`, backgroundColor: color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
