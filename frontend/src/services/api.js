import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// ── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

// ── API Methods ───────────────────────────────────────────────────────────────

export const apiService = {
  /** Health check */
  health: () => api.get('/health'),

  /** Analyze agricultural risk */
  analyzeRisk: (payload) => api.post('/risk/analyze', payload),

  /** Get regional risk data */
  getRegionalRisk: (state = null) =>
    api.get('/risk/regional', state ? { params: { state } } : {}),

  /** Get top risk factors */
  getRiskFactors: () => api.get('/risk/factors'),

  /** Get weather data */
  getWeather: (city, state) =>
    api.get('/weather', { params: { city, state } }),

  /** Get recommendations */
  getRecommendations: (breakdown, riskLevel) =>
    api.post('/recommendations', { ...breakdown, risk_level: riskLevel }),

  /** Get states and districts */
  getStatesDistricts: () => api.get('/meta/states'),

  /** Get crops list */
  getCrops: () => api.get('/meta/crops'),

  /** Get seasons list */
  getSeasons: () => api.get('/meta/seasons'),
}

export default apiService
