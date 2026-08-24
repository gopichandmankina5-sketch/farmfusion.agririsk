import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Leaf, BarChart3, Map, Lightbulb, Activity, Menu, X, Sprout, Globe
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function Navbar({ onMenuToggle, menuOpen }) {
  const location = useLocation()
  const { language, setLanguage, t } = useLanguage()

  const navLinks = [
    { to: '/',               label: t('home'),         icon: Leaf },
    { to: '/dashboard',      label: t('dashboard'),    icon: BarChart3 },
    { to: '/risk-analysis',  label: t('risk_analysis'), icon: Activity },
    { to: '/regional-risk',  label: t('regional_risk'), icon: Map },
    { to: '/recommendations',label: t('recommendations'), icon: Lightbulb },
  ]

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-agri-600 to-agri-800 rounded-xl 
                            flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div className="leading-none">
              <span className="text-xl font-bold text-agri-800 tracking-tight">Agri</span>
              <span className="text-xl font-bold text-agri-500 tracking-tight">Risk</span>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5 tracking-wide hidden sm:block">
                Agricultural Intelligence
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium 
                            transition-all duration-150
                            ${isActive(to)
                              ? 'bg-agri-50 text-agri-700 font-semibold'
                              : 'text-gray-600 hover:text-agri-700 hover:bg-agri-50'
                            }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* CTA + Mobile menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-gray-50 rounded-lg border border-gray-200 px-2 py-1">
              <Globe className="w-4 h-4 text-gray-500 mr-2" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-sm text-gray-700 outline-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="ta">தமிழ்</option>
                <option value="te">తెలుగు</option>
                <option value="hi">हिन्दी</option>
              </select>
            </div>
            
            <Link to="/risk-analysis" className="hidden sm:flex btn-primary text-sm py-2 px-4">
              <Activity className="w-4 h-4" />
              {t('analyze_risk')}
            </Link>
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-3 space-y-1 animate-fade-in">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={onMenuToggle}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                            ${isActive(to)
                              ? 'bg-agri-50 text-agri-700'
                              : 'text-gray-600 hover:bg-gray-50'
                            }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
