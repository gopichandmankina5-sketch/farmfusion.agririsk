import { recommendationTranslations } from './recommendationTranslations';

const WEATHER_RECS = {
  HIGH: [
    { id: 'w1', title: 'Monitor Drainage Systems', priority: 'high', riskType: 'weather' },
    { id: 'w2', title: 'Avoid Over-Irrigation', priority: 'high', riskType: 'weather' },
    { id: 'w3', title: 'Use Protective Mulching', priority: 'medium', riskType: 'weather' },
    { id: 'w4', title: 'Monitor for Waterlogging', priority: 'high', riskType: 'weather' },
  ],
  MEDIUM: [
    { id: 'w5', title: 'Track Weather Forecasts Daily', priority: 'medium', riskType: 'weather' },
    { id: 'w6', title: 'Prepare Drainage in Advance', priority: 'low', riskType: 'weather' },
  ],
  LOW: [
    { id: 'w7', title: 'Maintain Regular Irrigation Schedule', priority: 'low', riskType: 'weather' },
  ],
};

const PEST_RECS = {
  HIGH: [
    { id: 'p1', title: 'Intensify Field Inspections', priority: 'high', riskType: 'pest' },
    { id: 'p2', title: 'Apply Integrated Pest Management', priority: 'high', riskType: 'pest' },
    { id: 'p3', title: 'Install Pheromone Traps', priority: 'medium', riskType: 'pest' },
    { id: 'p4', title: 'Consult Agricultural Extension Officer', priority: 'high', riskType: 'pest' },
  ],
  MEDIUM: [
    { id: 'p5', title: 'Weekly Pest Surveillance', priority: 'medium', riskType: 'pest' },
    { id: 'p6', title: 'Apply Preventive Biopesticides', priority: 'medium', riskType: 'pest' },
  ],
  LOW: [
    { id: 'p7', title: 'Routine Crop Monitoring', priority: 'low', riskType: 'pest' },
  ],
};

const SOIL_RECS = {
  HIGH: [
    { id: 's1', title: 'Conduct Comprehensive Soil Testing', priority: 'high', riskType: 'soil' },
    { id: 's2', title: 'Correct Soil pH Imbalance', priority: 'high', riskType: 'soil' },
    { id: 's3', title: 'Replenish Soil Nutrients', priority: 'high', riskType: 'soil' },
    { id: 's4', title: 'Improve Soil Water Retention', priority: 'medium', riskType: 'soil' },
  ],
  MEDIUM: [
    { id: 's5', title: 'Apply Organic Matter', priority: 'medium', riskType: 'soil' },
    { id: 's6', title: 'Practice Crop Rotation', priority: 'medium', riskType: 'soil' },
  ],
  LOW: [
    { id: 's7', title: 'Maintain Soil Health', priority: 'low', riskType: 'soil' },
  ],
};

const MARKET_RECS = {
  HIGH: [
    { id: 'm1', title: 'Monitor Mandi Prices Daily', priority: 'high', riskType: 'market' },
    { id: 'm2', title: 'Consider Storage for Better Price', priority: 'high', riskType: 'market' },
    { id: 'm3', title: 'Explore Contract Farming', priority: 'medium', riskType: 'market' },
    { id: 'm4', title: 'Join Farmer Producer Organisations', priority: 'medium', riskType: 'market' },
  ],
  MEDIUM: [
    { id: 'm5', title: 'Diversify Marketing Channels', priority: 'medium', riskType: 'market' },
    { id: 'm6', title: 'Track Demand Trends', priority: 'medium', riskType: 'market' },
  ],
  LOW: [
    { id: 'm7', title: 'Standard Market Monitoring', priority: 'low', riskType: 'market' },
  ],
};

const PRODUCTION_RECS = {
  HIGH: [
    { id: 'pr1', title: 'Switch to High-Yield Varieties', priority: 'high', riskType: 'production' },
    { id: 'pr2', title: 'Optimise Sowing Schedule', priority: 'high', riskType: 'production' },
    { id: 'pr3', title: 'Adopt Precision Agriculture', priority: 'medium', riskType: 'production' },
    { id: 'pr4', title: 'Improve Crop Stand Density', priority: 'medium', riskType: 'production' },
  ],
  MEDIUM: [
    { id: 'pr5', title: 'Review Agronomic Practices', priority: 'medium', riskType: 'production' },
  ],
  LOW: [
    { id: 'pr6', title: 'Continue Current Practices', priority: 'low', riskType: 'production' },
  ],
};

const CRITICAL_RECS = [
  { id: 'cr1', title: '⚠️ Immediate Action Required', priority: 'critical', riskType: 'general' },
  { id: 'cr2', title: 'Activate Crop Insurance Claim', priority: 'critical', riskType: 'general' },
];

function getBucket(score) {
  if (score >= 61) return 'HIGH';
  if (score >= 31) return 'MEDIUM';
  return 'LOW';
}

/**
 * Dynamically generates risk-specific recommendations based on actual risk scores.
 */
export function generateRecommendations(breakdown = {}, risk_level = 'LOW', crop, state, district, season) {
  const recs = [];

  // 1. Critical global overrides
  if (risk_level === 'CRITICAL' || risk_level === 'critical') {
    recs.push(...CRITICAL_RECS);
  }

  // 2. Fetch recommendations based on category score buckets
  recs.push(...(WEATHER_RECS[getBucket(breakdown.weather || 0)] || []));
  recs.push(...(PEST_RECS[getBucket(breakdown.pest || 0)] || []));
  recs.push(...(SOIL_RECS[getBucket(breakdown.soil || 0)] || []));
  recs.push(...(MARKET_RECS[getBucket(breakdown.market || 0)] || []));
  recs.push(...(PRODUCTION_RECS[getBucket(breakdown.production || 0)] || []));

  // 3. Deduplicate by recommendation ID
  const unique = [];
  const seen = new Set();
  for (const r of recs) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      unique.push(r);
    }
  }

  // 4. Sort by severity/priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  unique.sort((a, b) => {
    const pA = priorityOrder[a.priority] !== undefined ? priorityOrder[a.priority] : 4;
    const pB = priorityOrder[b.priority] !== undefined ? priorityOrder[b.priority] : 4;
    return pA - pB;
  });

  // 5. Inject localized translations
  const localizedUnique = unique.map(r => {
    const translation = recommendationTranslations[r.id];
    if (translation) {
      return {
        ...r,
        title: {
          en: translation.en?.title || r.title,
          hi: translation.hi?.title || r.title,
          te: translation.te?.title || r.title,
          ta: translation.ta?.title || r.title,
        },
        description: {
          en: translation.en?.detail || "",
          hi: translation.hi?.detail || "",
          te: translation.te?.detail || "",
          ta: translation.ta?.detail || "",
        }
      };
    }
    return {
      ...r,
      title: { en: r.title, hi: r.title, te: r.title, ta: r.title },
      description: { en: "", hi: "", te: "", ta: "" }
    };
  });

  return localizedUnique;
}
