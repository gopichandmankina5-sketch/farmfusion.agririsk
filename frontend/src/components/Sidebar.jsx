import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BarChart3, Map, Lightbulb, Activity, Home, TrendingUp } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const navItems = [
  { to: '/',               label: 'Home',          icon: Home },
  { to: '/dashboard',      label: 'Dashboard',     icon: BarChart3 },
  { to: '/risk-analysis',  label: 'Risk Analysis', icon: Activity },
  { to: '/decision-simulator',label: 'Decision Simulator',icon: TrendingUp },
  { to: '/regional-risk',  label: 'Regional Risk', icon: Map },
  { to: '/recommendations',label: 'Recommendations',icon: Lightbulb },
]

export default function Sidebar() {
  const location = useLocation()
  const { t } = useLanguage()

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <aside className="w-64 min-h-screen glass-panel border-r border-white/40 flex-shrink-0 hidden xl:block z-40">
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
              <span className="text-sm">{t(label.toLowerCase().replace(' ', '_'))}</span>
            </Link>
          ))}
        </nav>


      </div>
    </aside>
  )
}
