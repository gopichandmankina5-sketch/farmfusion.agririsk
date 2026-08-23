import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getCategoryColor } from '../utils/riskUtils'

export default function RiskFactors({ factors = [] }) {
  if (!factors.length) return null

  const chartData = factors.map(f => ({
    name: f.name.length > 22 ? f.name.slice(0, 22) + '…' : f.name,
    fullName: f.name,
    impact: Math.round(f.impact),
    category: f.category,
    color: getCategoryColor(f.category),
  }))

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-gray-800">Contributing Factors</h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
          By impact score
        </span>
      </div>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          <XAxis type="number" domain={[0, 35]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value, _, props) => [value, props.payload.fullName]}
            contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
          />
          <Bar dataKey="impact" radius={[0, 6, 6, 0]} maxBarSize={18}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Factor pills */}
      <div className="mt-5 space-y-2">
        {factors.slice(0, 6).map((f, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
            <div className="flex items-center gap-2.5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: getCategoryColor(f.category) }}
              />
              <div>
                <p className="text-sm font-medium text-gray-800">{f.name}</p>
                <p className="text-xs text-gray-400 capitalize">{f.category} risk</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(f.impact / 35) * 100}%`,
                    backgroundColor: getCategoryColor(f.category)
                  }}
                />
              </div>
              <span className="text-sm font-bold text-gray-700 w-8 text-right">
                {Math.round(f.impact)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
