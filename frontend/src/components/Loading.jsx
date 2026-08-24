import React from 'react'
import { Sprout } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function Loading({ message }) {
  const { t } = useLanguage()
  const displayMessage = message || t('analyzing_data') || 'Analyzing agricultural data…'
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-agri-100 border-t-agri-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sprout className="w-6 h-6 text-agri-600" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-gray-700 font-semibold">{displayMessage}</p>
        <p className="text-sm text-gray-400 mt-1">{t('running_ml_models') || 'Running ML models and risk calculations…'}</p>
      </div>
      {/* Animated dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-agri-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}
