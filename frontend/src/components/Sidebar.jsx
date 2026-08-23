import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BarChart3, Map, Lightbulb, Activity, Home, TrendingUp } from 'lucide-react'

const navItems = [
  { to: '/',               label: 'Home',          icon: Home },
  { to: '/dashboard',      label: 'Dashboard',     icon: BarChart3 },
  { to: '/risk-analysis',  label: 'Risk Analysis', icon: Activity },
  { to: '/regional-risk',  label: 'Regional Risk', icon: Map },
  { to: '/recommendations',label: 'Recommendations',icon: Lightbulb },
]

export default function Sidebar() {
  const location = useLocation()

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex-shrink-0 hidden xl:block">
      <div className="p-4 pt-6">
        {/* Section: Navigation */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-4">
          Navigation
        </p>
        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`sidebar-item ${isActive(to) ? 'sidebar-item-active' : ''}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div className="my-6 border-t border-gray-100" />

        {/* Risk Legend */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-4">
          Risk Levels
        </p>
        <div className="space-y-2 px-2">
          {[
            { level: 'LOW',      color: 'bg-green-500',  range: '0–30' },
            { level: 'MEDIUM',   color: 'bg-yellow-500', range: '31–60' },
            { level: 'HIGH',     color: 'bg-orange-500', range: '61–80' },
            { level: 'CRITICAL', color: 'bg-red-500',    range: '81–100' },
          ].map(({ level, color, range }) => (
            <div key={level} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-xs font-medium text-gray-600">{level}</span>
              </div>
              <span className="text-xs text-gray-400">{range}</span>
            </div>
          ))}
        </div>

        {/* Quick Stats placeholder */}
        <div className="mt-6 mx-2 p-4 bg-agri-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-agri-600" />
            <span className="text-xs font-semibold text-agri-700">Platform Stats</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">States Covered</span>
              <span className="text-xs font-bold text-agri-700">10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Districts</span>
              <span className="text-xs font-bold text-agri-700">100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Crops Tracked</span>
              <span className="text-xs font-bold text-agri-700">15</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
