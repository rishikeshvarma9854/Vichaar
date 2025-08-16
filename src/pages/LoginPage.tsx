import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { GraduationCap, Moon, Sun, Search, User, Hash, Eye, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabaseDB } from '@/lib/supabase'
import apiClient from '@/lib/api'

// TypeScript declarations for hCaptcha (same as register page)
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

export default function LoginPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaRef, setCaptchaRef] = useState<any | null>(null)
  const [hcaptchaLoaded, setHcaptchaLoaded] = useState(false)
  const [hcaptchaError, setHcaptchaError] = useState(false)
  const hasInitializedRef = useRef(false) // Track if we've ever initialized
  
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleHcaptchaVerify = useCallback((token: string) => {
    console.log('hCaptcha verified:', token)
    setCaptchaToken(token)
    toast.success('Security verification completed! ✅')
  }, [])

  const handleHcaptchaExpired = useCallback(() => {
    console.log('hCaptcha expired')
    setCaptchaToken('')
    toast.error('Security verification expired. Please verify again.')
  }, [])

  const handleHcaptchaError = useCallback(() => {
    console.log('hCaptcha error')
    setCaptchaToken('')
    toast.error('Security verification failed. Please try again.')
  }, [])

  // Simple hCaptcha initialization (same as register page)
  useEffect(() => {
    if (!window.hcaptcha || hasInitializedRef.current) return
    
    try {
      console.log('Initializing hCaptcha...')
      
      const widgetId = window.hcaptcha.render('hcaptcha-container', {
        sitekey: '898273e0-27c2-47fa-bf84-7bb23b6432d4',
        callback: handleHcaptchaVerify,
        'expired-callback': handleHcaptchaExpired,
        'error-callback': handleHcaptchaError,
        theme: theme === 'dark' ? 'dark' : 'light'
      })
      
      console.log('hCaptcha initialized with ID:', widgetId)
      setHcaptchaLoaded(true)
      hasInitializedRef.current = true
      
    } catch (error) {
      console.error('Failed to initialize hCaptcha:', error)
      setHcaptchaError(true)
    }
  }, [theme, handleHcaptchaVerify, handleHcaptchaExpired, handleHcaptchaError])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) {
      toast.error('Please enter a hall ticket number or name')
      return
    }

    if (!captchaToken) {
      toast.error('Please complete the security verification')
      return
    }

    setIsLoading(true)
    
    try {
      console.log('🔍 Search Debug:')
      console.log('Search query:', searchQuery.trim())
      console.log('Captcha token:', captchaToken ? 'Present' : 'Missing')
      
      // Enhanced search: Try multiple search strategies
      let searchResults = null
      let searchError = null
      
      // Strategy 1: Try exact hall ticket match first (fastest)
      if (/^[A-Z0-9]+$/.test(searchQuery.trim())) {
        console.log('🔍 Fast search by exact hall ticket:', searchQuery.trim())
        const result = await supabaseDB.searchByHallTicket(searchQuery.trim())
        searchResults = result.data
        searchError = result.error
      }
      
      // Strategy 2: If no results, try partial name search
      if ((!searchResults || searchResults.length === 0) && searchQuery.trim().length >= 2) {
        console.log('🔍 Partial name search:', searchQuery.trim())
        const result = await supabaseDB.searchByName(searchQuery.trim())
        if (result.data && result.data.length > 0) {
          searchResults = result.data
          searchError = result.error
        }
      }
      
      // Strategy 3: If still no results, try broader search
      if (!searchResults || searchResults.length === 0) {
        console.log('🔍 Broad search:', searchQuery.trim())
        const result = await supabaseDB.searchStudent(searchQuery.trim())
        searchResults = result.data
        searchError = result.error
      }
      
      if (searchError) {
        console.error('Database search error:', searchError)
        toast.error('Search failed. Please try again.')
        return
      }

      console.log('Search results:', searchResults)
      console.log('Number of results:', searchResults?.length || 0)

      if (searchResults && searchResults.length > 0) {
        // Found student(s) - show results for selection
        setSearchResults(searchResults)
        setHasSearched(true)
        toast.success(`Found ${searchResults.length} student(s)!`)
        
      } else {
        setSearchResults([])
        setHasSearched(true)
        toast('No students found with that search term. Try a different name or hall ticket number.')
      }
    } catch (error: any) {
      console.error('Search error:', error)
      toast.error('Search failed. Please try again.')
    } finally {
      setIsLoading(false)
      // Reset captcha after search (same as register page)
      if (window.hcaptcha) {
        window.hcaptcha.reset()
        setCaptchaToken(null)
      }
    }
  }

  // Auto-login to KMIT API using stored credentials
  const autoLoginToKMIT = async (mobileNumber: string, password: string, studentProfile: any) => {
    try {
      console.log('🔄 Auto-login to KMIT API...')
      console.log('🚀 Using same method as register page...')
      
      // Ensure captcha token is present
      if (!captchaToken) {
        console.error('❌ No captcha token available');
        toast.error('Security verification required. Please try again.');
        return;
      }
      
      // Prepare login payload with captcha token (same as register page)
      const loginPayload = {
        username: mobileNumber,
        password: password,
        application: "netra",
        token: captchaToken
      }
      
      console.log('🔍 Search Login Request Details:');
      console.log('Using apiClient.loginWithToken (same as register page)');
      console.log('Payload:', { ...loginPayload, token: '***' });
      console.log('Timestamp:', new Date().toISOString());
      console.log('Student Profile:', studentProfile);
      
      // Use the EXACT same method as register page
      const response = await apiClient.loginWithToken(loginPayload)
      
      console.log('🔍 API Response:', response);
      
      if (response && !response.Error) {
        // Login successful - same logic as register page
        console.log('✅ Auto-login successful!')
        
        // Store tokens (same as register page)
        localStorage.setItem('kmit_access_token', response.access_token)
        localStorage.setItem('kmit_refresh_token', response.refresh_token)
        localStorage.setItem('kmit_student_id', response.sub?.toString() || '')
        
        // Store current student profile with mobile number
        const enhancedStudentProfile = {
          ...studentProfile,
          mobile_number: mobileNumber // Ensure mobile number is included
        }
        localStorage.setItem('currentStudent', JSON.stringify(enhancedStudentProfile))
        
        toast.success('Login successful! Redirecting to dashboard...')
        
        // Navigate to dashboard
        navigate('/dashboard')
        
      } else {
        console.error('API login failed:', response)
        toast.error('Login failed. Please try again.')
      }
      
    } catch (error: any) {
      console.error('Auto-login error:', error)
      toast.error(error.message || 'Login failed. Please try again.')
    }
  }

  const handleViewStudent = (student: any) => {
    // Store current student data and tokens for dashboard
    localStorage.setItem('currentStudent', JSON.stringify(student))
    
    // Get tokens for this student (if available)
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    const tokenExpiry = localStorage.getItem('tokenExpiry')
    
    if (accessToken) {
      localStorage.setItem('currentTokens', JSON.stringify({
        accessToken,
        refreshToken,
        tokenExpiry: tokenExpiry ? parseInt(tokenExpiry) : Date.now() + (8 * 60 * 60 * 1000)
      }))
    }
    
    // Navigate to dashboard
    navigate('/dashboard')
  }

  // Handle when a student result is clicked
  const handleStudentClick = async (student: any) => {
    try {
      console.log('🎯 Student selected:', student)
      
      // Get credentials for this student
      const { data: credentials, error: credError } = await supabaseDB.getCredentials(student.mobile_number)
      
      if (credError || !credentials) {
        console.error('Failed to get credentials:', credError)
        toast.error('Student found but login failed. Please try again.')
        return
      }

      console.log('Got credentials for:', student.mobile_number)
      
      // Now automatically login to KMIT API using stored credentials + captcha
      await autoLoginToKMIT(credentials.mobile_number, credentials.password, student)
      
    } catch (error: any) {
      console.error('Student selection error:', error)
      toast.error('Failed to select student. Please try again.')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert input to uppercase
    setSearchQuery(e.target.value.toUpperCase())
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setHasSearched(false)
  }

  // hCaptcha handlers
  const onCaptchaVerify = (token: string) => {
    console.log('✅ Captcha verified, token:', token.substring(0, 20) + '...')
    setCaptchaToken(token)
  }

  const onCaptchaExpired = () => {
    console.log('⏰ Captcha expired')
    setCaptchaToken(null)
    toast.error('Captcha expired. Please verify again.')
  }

  const onCaptchaError = (err: string) => {
    console.error('❌ Captcha error:', err)
    setCaptchaToken(null)
    toast.error('Captcha verification failed. Please try again.')
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

      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-full mb-8">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-4">
            KMIT VICHAAR
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Find student information instantly
          </p>
        </div>

        {/* Search Form */}
        <div className="card backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-center mb-8 text-gray-800 dark:text-white">
            Search Student
          </h2>
          
          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                Enter Hall Ticket Number or Student Name
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {searchQuery.match(/^\d+$/) ? <Hash className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleInputChange}
                  placeholder="Enter hall ticket number or name"
                  className="input-field pl-12 pr-4 text-center text-lg font-medium tracking-wider"
                  required
                  autoFocus
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                All input is automatically converted to uppercase
              </p>
            </div>

            {/* hCaptcha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Security Verification
              </label>
              
              {/* Simple hCaptcha container (same as register page) */}
              <div 
                id="hcaptcha-container"
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
              
              {captchaToken && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2 text-center">
                  ✅ Security verification completed
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !captchaToken}
              className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Searching...
                </div>
              ) : (
                '🔍 Search Student'
              )}
            </button>
          </form>

          {/* Search Results */}
          {hasSearched && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Search Results
              </h3>
              
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((student: any, index: number) => (
                    <div
                      key={student.id || index}
                      onClick={() => handleStudentClick(student)}
                      className="bg-gray-800 dark:bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200 border border-gray-600 dark:border-gray-500"
                    >
                      <div className="flex items-center space-x-4">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        
                        {/* Student Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-lg font-bold text-white truncate">
                            {student.hall_ticket || 'No Hall Ticket'}
                          </div>
                          <div className="text-sm text-gray-300">
                            {student.name ? `Name: ${student.name}` : 'No Name'}
                          </div>
                          {student.branch && (
                            <div className="text-xs text-gray-400 mt-1">
                              {student.branch}
                            </div>
                          )}
                          {student.year && (
                            <div className="text-xs text-gray-400">
                              Current Year: {student.year}
                            </div>
                          )}
                        </div>
                        
                        {/* Click Indicator */}
                        <div className="flex-shrink-0">
                          <ArrowRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-lg mb-2">No students found</div>
                  <div className="text-gray-500 text-sm">
                    Try searching with a different name or hall ticket number
                  </div>
                </div>
              )}
            </div>
          )}

          {hasSearched && searchResults.length === 0 && (
            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                No students found with that search term. Try a different name or hall ticket number.
              </p>
              <button
                onClick={handleClearSearch}
                className="btn-secondary mt-4"
              >
                Clear Search
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Need to login to KMIT system?
            </p>
            <Link
              to="/register"
              className="btn-secondary inline-block"
            >
              Login to KMIT
            </Link>
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
