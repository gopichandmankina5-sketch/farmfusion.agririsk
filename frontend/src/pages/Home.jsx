import React from 'react'
import { Link } from 'react-router-dom'
import { Activity, Map, BarChart3, Lightbulb, ArrowRight, Shield, Zap, Globe, Sprout } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function Home() {
  const { t, language } = useLanguage()

  const features = [
    {
      icon: '🌦️',
      title: t('Weather Risk'),
      desc: t('feature_w_desc'),
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: '🐛',
      title: t('Pest Risk'),
      desc: t('feature_p_desc'),
      color: 'bg-orange-50 text-orange-600',
    },
    {
      icon: '🌱',
      title: t('Soil Risk'),
      desc: t('feature_s_desc'),
      color: 'bg-green-50 text-green-600',
    },
    {
      icon: '📈',
      title: t('Market Risk'),
      desc: t('feature_m_desc'),
      color: 'bg-purple-50 text-purple-600',
    },
    {
      icon: '🌾',
      title: t('Production Risk'),
      desc: t('feature_pr_desc'),
      color: 'bg-amber-50 text-amber-600',
    },
  ]

  const steps = [
    {
      num: '01',
      icon: Globe,
      title: t('step_1_title'),
      desc: t('step_1_desc'),
    },
    {
      num: '02',
      icon: Zap,
      title: t('step_2_title'),
      desc: t('step_2_desc'),
    },
    {
      num: '03',
      icon: BarChart3,
      title: t('step_3_title'),
      desc: t('step_3_desc'),
    },
    {
      num: '04',
      icon: Lightbulb,
      title: t('step_4_title'),
      desc: t('step_4_desc'),
    },
  ]

  const stats = [
    { value: '10',  label: t('states_covered') },
    { value: '100', label: t('districts') },
    { value: '15',  label: t('crops_tracked') },
    { value: '5',   label: t('risk_categories') },
  ]

  return (
    <div className="animate-fade-in">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="hero-gradient hero-pattern text-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/20">
            <Sprout className="w-4 h-4 text-agri-300" />
            <span className="text-agri-100">{t('powered_by_ml')}</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold mb-5 leading-tight tracking-tight">
            Agri<span className="text-agri-400">Risk</span>
          </h1>
          <p className="text-xl sm:text-2xl font-semibold text-agri-100 mb-3">
            {t('ai_powered_intel')}
          </p>
          <p className="text-base text-agri-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('hero_desc')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/risk-analysis" className="btn-primary text-base py-3.5 px-8 bg-agri-500 hover:bg-agri-400">
              <Activity className="w-5 h-5" />
              {t('analyze_now')}
            </Link>
            <Link to="/regional-risk"
                  className="flex items-center gap-2 justify-center border-2 border-white/30 text-white hover:bg-white/10 
                             font-semibold px-8 py-3.5 rounded-xl transition-all duration-200">
              <Map className="w-5 h-5" />
              {t('explore_regional')}
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-extrabold text-white">{value}</p>
                <p className="text-sm text-agri-200 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              {t('comp_risk_cover')}
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              {t('comp_risk_desc')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon, title, desc, color }) => (
              <div key={title} className="card card-hover p-6 group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${color}`}>
                  {icon}
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}

            {/* CTA card */}
            <Link to="/dashboard"
                  className="card card-hover p-6 bg-agri-600 text-white group flex flex-col justify-between
                             col-span-1 sm:col-span-2 lg:col-span-1">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">{t('view_dashboard')}</h3>
                <p className="text-sm text-agri-100 leading-relaxed">
                  {t('view_dashboard_desc')}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-4 text-agri-200 group-hover:text-white transition-colors">
                <span className="text-sm font-semibold">{t('go_to_dashboard')}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it Works ──────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{t('how_it_works')}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              {t('how_it_works_desc')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ num, icon: Icon, title, desc }, idx) => (
              <div key={num} className="relative">
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-[calc(100%+8px)] w-8 
                                  border-t-2 border-dashed border-agri-200 z-0" />
                )}
                <div className="card text-center p-6 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-agri-600 text-white flex items-center justify-center
                                  font-bold text-sm mx-auto mb-4 shadow-sm">
                    {num}
                  </div>
                  <Icon className="w-6 h-6 text-agri-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-800 text-sm mb-2">{title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <Shield className="w-12 h-12 text-agri-600 mx-auto mb-5" />
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {t('ready_protect')}
          </h2>
          <p className="text-gray-500 mb-8">
            {t('run_first_analysis')}
          </p>
          <Link to="/risk-analysis" className="btn-primary text-base py-3.5 px-10 inline-flex">
            <Activity className="w-5 h-5" />
            {t('start_free_analysis')}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
