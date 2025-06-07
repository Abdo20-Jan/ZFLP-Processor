import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import Header from '@/components/Header'
import HomePage from '@/components/pages/HomePage'
import ProcessorPage from '@/components/pages/ProcessorPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/processor" element={<ProcessorPage />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </Router>
  )
}

export default App

