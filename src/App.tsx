import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import SearchPage from './pages/SearchPage'
import ResultsPage from './pages/ResultsPage'
import LoadingSpinner from './components/LoadingSpinner'
<<<<<<< HEAD
import CacheMonitor from './components/CacheMonitor'
=======
import EgressMonitor from './components/EgressMonitor'
>>>>>>> c150539005628d646e4fac8d283722a09278dcf0

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
          
<<<<<<< HEAD
          {/* 🎯 Cache Monitor - Shows cache performance and helps reduce egress */}
          <CacheMonitor />
=======
          {/* 🚀 Egress Monitor - Track your Supabase usage */}
          <EgressMonitor />
>>>>>>> c150539005628d646e4fac8d283722a09278dcf0
        </div>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
