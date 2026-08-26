import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translateValue } from '../utils/translations';
import { Calendar } from 'lucide-react';

export default function SeasonalCalendar({ outlook = [] }) {
  const { language, t } = useLanguage();

  if (!outlook || outlook.length === 0) {
    return (
      <div className="card mt-8 animate-fade-in border-dashed border-2 border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center py-10">
        <Calendar className="w-8 h-8 text-gray-300 mb-3" />
        <h3 className="text-gray-500 font-medium">{t('seasonal_outlook_unavailable')}</h3>
        <p className="text-xs text-gray-400 mt-1">{t('run_analysis_to_generate_calendar')}</p>
      </div>
    );
  }

  const getRiskIcon = (level) => {
    switch (level) {
      case 'CRITICAL': return '🔴';
      case 'HIGH': return '🟠';
      case 'MEDIUM': return '🟡';
      case 'LOW': return '🟢';
      default: return '⚪';
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-50 text-red-700 font-bold';
      case 'HIGH': return 'bg-orange-50 text-orange-700 font-semibold';
      case 'MEDIUM': return 'bg-yellow-50 text-yellow-700 font-medium';
      case 'LOW': return 'bg-green-50 text-green-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="card mt-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-full bg-agri-100 flex items-center justify-center text-agri-600">
          <Calendar className="w-4 h-4" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{t('seasonal_risk_outlook')}</h3>
      </div>
      
      <p className="text-sm text-gray-500 mb-6">
        {t('month_by_month_projection')}
      </p>

      <div className="overflow-x-auto pb-4">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 rounded-tl-xl">{t('month')}</th>
              <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">{t('weather')}</th>
              <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">{t('pest')}</th>
              <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">{t('soil')}</th>
              <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">{t('market')}</th>
              <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">{t('production')}</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 rounded-tr-xl">{t('overall_risk')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {outlook.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                  {translateValue(item.month, language)}
                </td>
                <td className="py-4 px-4 text-center text-lg" title={item.weather}>{getRiskIcon(item.weather)}</td>
                <td className="py-4 px-4 text-center text-lg" title={item.pest}>{getRiskIcon(item.pest)}</td>
                <td className="py-4 px-4 text-center text-lg" title={item.soil}>{getRiskIcon(item.soil)}</td>
                <td className="py-4 px-4 text-center text-lg" title={item.market}>{getRiskIcon(item.market)}</td>
                <td className="py-4 px-4 text-center text-lg" title={item.production}>{getRiskIcon(item.production)}</td>
                <td className="py-4 px-4 text-right whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs ${getRiskColor(item.overall)}`}>
                    {getRiskIcon(item.overall)} <span className="ml-1.5">{translateValue(item.overall, language)}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
