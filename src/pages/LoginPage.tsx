import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { GraduationCap, Moon, Sun, Search, User, Hash, Eye, ArrowRight, Smartphone, Lock, EyeOff } from 'lucide-react'
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
  const [searchStrategy, setSearchStrategy] = useState<string>('')
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
    }
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
    
    // Since we're using auto-search, just prevent form submission
    // The search is already happening as user types
    return
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
      // Check if captcha is completed before allowing login
      if (!captchaToken) {
        toast.error('Please complete the security verification before logging in')
        return
      }
      
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
    const value = e.target.value
    setSearchQuery(value)
    
    // Auto-search as user types (with debouncing)
    if (value.trim().length >= 2) {
      // Clear previous timeout
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }
      
      // Set new timeout for auto-search - convert to uppercase for search
      searchTimeout.current = setTimeout(() => {
        handleAutoSearch(value.trim().toUpperCase())
      }, 300) // Reduced delay for better responsiveness
    } else {
      // Clear results if input is too short
      setSearchResults([])
      setHasSearched(false)
      setSearchStrategy('')
    }
  }

  // Auto-search function (separate from form submit)
  const handleAutoSearch = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) return
    
    setIsLoading(true)
    
    try {
      console.log('🔍 Auto-search for:', query.trim())
      
      // Enhanced search: Try multiple search strategies with better prioritization
      let searchResults = null
      let searchError = null
      let currentStrategy = ''
      
      // Strategy 1: Try exact hall ticket match first (fastest and most accurate)
      if (/^[A-Z0-9]+$/.test(query.trim())) {
        console.log('🔍 Fast search by exact hall ticket:', query.trim())
        const result = await supabaseDB.searchByHallTicket(query.trim())
        searchResults = result.data
        searchError = result.error
        if (searchResults && searchResults.length > 0) {
          console.log('✅ Found exact hall ticket match')
          currentStrategy = 'exact-hall-ticket'
        }
      }
      
      // Strategy 2: If no results, try partial hall ticket search
      if ((!searchResults || searchResults.length === 0) && query.trim().length >= 2) {
        console.log('🔍 Partial hall ticket search:', query.trim())
        const result = await supabaseDB.searchByPartialHallTicket(query.trim())
        if (result.data && result.data.length > 0) {
          searchResults = result.data
          searchError = result.error
          console.log('✅ Found partial hall ticket matches')
          currentStrategy = 'partial-hall-ticket'
        }
      }
      
      // Strategy 3: If still no results, try improved name search
      if ((!searchResults || searchResults.length === 0) && query.trim().length >= 2) {
        console.log('🔍 Improved name search:', query.trim())
        const result = await supabaseDB.searchByName(query.trim())
        if (result.data && result.data.length > 0) {
          searchResults = result.data
          searchError = result.error
          console.log('✅ Found name matches')
          currentStrategy = 'name-search'
        }
      }
      
      // Strategy 4: If still no results, try broader search with better filtering
      if (!searchResults || searchResults.length === 0) {
        console.log('🔍 Broad search with filtering:', query.trim())
        const result = await supabaseDB.searchStudent(query.trim())
        if (result.data && result.data.length > 0) {
          // Filter results to prioritize better matches
          const filteredResults = result.data.filter((student: any) => {
            const queryUpper = query.trim().toUpperCase()
            const nameUpper = (student.name || '').toUpperCase()
            const hallTicketUpper = (student.hall_ticket || '').toUpperCase()
            
            // Prioritize results that start with the query
            const nameStartsWith = nameUpper.startsWith(queryUpper)
            const hallTicketStartsWith = hallTicketUpper.startsWith(queryUpper)
            
            return nameStartsWith || hallTicketStartsWith || 
                   nameUpper.includes(queryUpper) || 
                   hallTicketUpper.includes(queryUpper)
          })
          
          if (filteredResults.length > 0) {
            searchResults = filteredResults
            currentStrategy = 'filtered-broad-search'
          } else {
            searchResults = result.data
            currentStrategy = 'broad-search'
          }
          searchError = result.error
          console.log('✅ Found broad search matches')
        }
      }
      
      if (searchError) {
        console.error('Auto-search error:', searchError)
        return
      }
      
      console.log('Auto-search results:', searchResults)
      console.log('Search strategy used:', currentStrategy)
      
      if (searchResults && searchResults.length > 0) {
        // Sort results by relevance
        const sortedResults = searchResults.sort((a: any, b: any) => {
          const queryUpper = query.trim().toUpperCase()
          const aName = (a.name || '').toUpperCase()
          const bName = (b.name || '').toUpperCase()
          const aHallTicket = (a.hall_ticket || '').toUpperCase()
          const bHallTicket = (b.hall_ticket || '').toUpperCase()
          
          // Exact matches first
          if (aName === queryUpper || aHallTicket === queryUpper) return -1
          if (bName === queryUpper || bHallTicket === queryUpper) return 1
          
          // Starts with query
          if (aName.startsWith(queryUpper) || aHallTicket.startsWith(queryUpper)) return -1
          if (bName.startsWith(queryUpper) || bHallTicket.startsWith(queryUpper)) return 1
          
          // Contains query
          if (aName.includes(queryUpper) || aHallTicket.includes(queryUpper)) return -1
          if (bName.includes(queryUpper) || bHallTicket.includes(queryUpper)) return 1
          
          // Default sort by name
          return aName.localeCompare(bName)
        })
        
        setSearchResults(sortedResults)
        setSearchStrategy(currentStrategy)
        setHasSearched(true)
      } else {
        setSearchResults([])
        setSearchStrategy(currentStrategy)
        setHasSearched(true)
      }
    } catch (error: any) {
      console.error('Auto-search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Clear search and results
  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setHasSearched(false)
    setSearchStrategy('')
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }
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
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-3">
            Find student information instantly
          </p>
          {/* Important note for new users */}
          <div className="max-w-md mx-auto p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
              ⚠️ New users and students: Please login to continue. 
              <br />
              <span className="text-xs">Don't use parents' mobile number - use your Netra credentials only</span>
            </p>
          </div>
        </div>

        {/* Search Form */}
        <div className="card backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-center mb-8 text-gray-800 dark:text-white">
            Search Student
          </h2>
          
          <form onSubmit={handleSearch} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
                Enter Hall Ticket Number or Student Name
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {searchQuery.match(/^[A-Z0-9]+$/) ? <Hash className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleInputChange}
                  placeholder="Start typing hall ticket or name..."
                  className="input-field pl-12 pr-4 text-center text-lg font-medium tracking-wider h-14"
                  required
                  autoFocus
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </div>
              </div>
              
              {/* Loading indicator for auto-search */}
              {isLoading && (
                <div className="flex items-center justify-center mt-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Searching...</span>
                </div>
              )}
              
              {/* Show when user is typing but not yet searching */}
              {searchQuery.trim().length >= 2 && !isLoading && !hasSearched && (
                <div className="flex items-center justify-center mt-4">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-3"></div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Type to search...</span>
                </div>
              )}
              
              {/* Show search status */}
              {hasSearched && searchResults.length > 0 && (
                <div className="flex items-center justify-center mt-4">
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                    ✅ Found {searchResults.length} result{searchResults.length === 1 ? '' : 's'}
                  </div>
                </div>
              )}
            </div>

            {/* Captcha Note - Clear instruction */}
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                🔒 Solve captcha below before clicking on search results to login
              </p>
            </div>

            {/* hCaptcha - Now below the note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                Security Verification (Required for Login)
              </label>
              
              {/* Simple hCaptcha container (same as register page) */}
              <div 
                id="hcaptcha-container"
                className="flex justify-center min-h-[78px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
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
                <div className="mt-3 text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                    ✅ Security verification completed - You can now click on search results to login
                  </p>
                </div>
              )}
            </div>
          </form>

          {/* Search Results */}
          {hasSearched && searchResults.length > 0 && (
            <div className="mt-8">
              {/* Results count */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  Search Results
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Found <span className="font-semibold text-blue-600 dark:text-blue-400">{searchResults.length}</span> student{searchResults.length === 1 ? '' : 's'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Click on a result to login (captcha required)
                </p>
                
                {/* Search strategy indicator */}
                {searchStrategy && (
                  <div className="mt-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                      {searchStrategy === 'exact-hall-ticket' && '🎯 Exact Hall Ticket Match'}
                      {searchStrategy === 'partial-hall-ticket' && '🔍 Partial Hall Ticket Match'}
                      {searchStrategy === 'name-search' && '👤 Name Match'}
                      {searchStrategy === 'filtered-broad-search' && '🌐 Filtered Broad Search Match'}
                      {searchStrategy === 'broad-search' && '🌐 Broad Search Match'}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Results grid */}
              <div className="space-y-4">
                {searchResults.map((student: any, index: number) => (
                  <div
                    key={student.id || index}
                    onClick={() => handleStudentClick(student)}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                  >
                    <div className="flex items-center space-x-6">
                      {/* Profile Picture */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                          {student.name ? student.name.charAt(0) : 'S'}
                        </div>
                      </div>
                      
                      {/* Student Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800">
                            {student.hall_ticket || 'N/A'}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate mb-2">
                          {student.name || 'Student Name'}
                        </h3>
                        <p className="text-base text-gray-700 dark:text-gray-300 truncate mb-2">
                          {student.branch || 'Branch not specified'}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            {student.year || 'Year not specified'}
                          </span>
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                            {student.semester || 'Semester not specified'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Click indicator */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                          <ArrowRight className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasSearched && searchResults.length === 0 && (
            <div className="mt-8 text-center">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No students found
                </h3>
                <p className="text-gray-500 dark:text-gray-500 mb-6">
                  Try a different hall ticket number or name
                </p>
                <button
                  onClick={handleClearSearch}
                  className="btn-secondary px-6 py-2"
                >
                  Clear Search
                </button>
              </div>
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
