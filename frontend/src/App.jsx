import React, { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Navbar  from './components/Navbar'
import Sidebar from './components/Sidebar'
import Home            from './pages/Home'
import Dashboard       from './pages/Dashboard'
import RiskAnalysis    from './pages/RiskAnalysis'
import RegionalRisk    from './pages/RegionalRisk'
import Recommendations from './pages/Recommendations'
import VoiceAssistant  from './components/VoiceAssistant'

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar onMenuToggle={() => setMenuOpen(m => !m)} menuOpen={menuOpen} />

          <div className="flex flex-1">
            {/* Sidebar – desktop only */}
            <Sidebar />

            {/* Main content */}
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/"                element={<Home />} />
                <Route path="/dashboard"       element={<Dashboard />} />
                <Route path="/risk-analysis"   element={<RiskAnalysis />} />
                <Route path="/regional-risk"   element={<RegionalRisk />} />
                <Route path="/recommendations" element={<Recommendations />} />
                {/* 404 */}
                <Route path="*" element={
                  <div className="p-10 text-center">
                    <p className="text-5xl font-extrabold text-agri-200 mb-3">404</p>
                    <p className="text-gray-500">Page not found.</p>
                    <a href="/" className="btn-primary mt-6 inline-flex">Go Home</a>
                  </div>
                } />
              </Routes>
            </main>
          </div>
          <VoiceAssistant />
        </div>
      </BrowserRouter>
  )
}
