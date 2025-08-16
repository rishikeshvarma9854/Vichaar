import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  GraduationCap, Moon, Sun, ArrowLeft, Search, User, 
  Calendar, BarChart3, Clock, Users, QrCode
} from 'lucide-react'
import toast from 'react-hot-toast'

interface StudentSearchResult {
  kmit_id: number
  name: string
  hall_ticket: string
  roll_number: string
  branch: string
  year: number
  semester: number
  email: string
  phone: string
  branch_code: string
  course: string
  section: string
  admission_year: number
  dob: string
  father_name: string
  father_mobile: string
  gender: string
  student_type: string
  status: string
  regulation: string
  last_updated: string
}

export default function SearchPage() {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Check if we have initial search results from navigation
  useEffect(() => {
    if (location.state?.searchQuery && location.state?.searchResults) {
      setSearchQuery(location.state.searchQuery)
      setSearchResults(location.state.searchResults)
      setHasSearched(true)
    }
  }, [location.state])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a name or hall ticket number')
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    try {
      const response = await fetch(`http://localhost:5000/api/search-students?q=${encodeURIComponent(searchQuery.trim())}`)
      const data = await response.json()

      if (data.success) {
        setSearchResults(data.data.students)
        if (data.data.total_results === 0) {
          toast('No students found with that search term')
        } else {
          toast.success(`Found ${data.data.total_results} student(s)`)
        }
      } else {
        toast.error(data.error || 'Search failed')
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed. Please try again.')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getOrdinalSuffix = (num: number): string => {
    if (num >= 11 && num <= 13) return 'th'
    switch (num % 10) {
      case 1: return 'st'
      case 2: return 'nd'
      case 3: return 'rd'
      default: return 'th'
    }
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-purple-600">KMIT VICHAAR</h1>
                <p className="text-sm text-gray-500">Student Information Portal</p>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Search Student Database</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Find any registered student by name or hall ticket number
          </p>
          
          {/* Search Input */}
          <div className="max-w-2xl mx-auto">
            <div className="flex shadow-lg rounded-lg overflow-hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="Enter student name or hall ticket number..."
                className={`flex-1 px-6 py-4 text-lg ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border-r focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold transition-colors flex items-center space-x-2"
              >
                {isSearching ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span>{isSearching ? 'Searching...' : 'Search'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="space-y-6">
            {searchResults.length > 0 ? (
              <>
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Search Results</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Found {searchResults.length} student(s) for "{searchQuery}"
                  </p>
                </div>
                
                <div className="grid gap-6">
                  {searchResults.map((student) => (
                    <div
                      key={student.kmit_id}
                      className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <h4 className="text-xl font-semibold">{student.name}</h4>
                              <p className="text-gray-600 dark:text-gray-300">
                                {student.hall_ticket} • {student.branch}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-500 dark:text-gray-400">Roll Number:</span>
                              <p>{student.roll_number || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500 dark:text-gray-400">Year & Semester:</span>
                              <p>{student.year}{getOrdinalSuffix(student.year)} Year, {student.semester}{getOrdinalSuffix(student.semester)} Semester</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500 dark:text-gray-400">Section:</span>
                              <p>{student.section || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500 dark:text-gray-400">Admission Year:</span>
                              <p>{student.admission_year || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500 dark:text-gray-400">Email:</span>
                              <p className="truncate">{student.email || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500 dark:text-gray-400">Phone:</span>
                              <p>{student.phone || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500 dark:text-gray-400">Gender:</span>
                              <p>{student.gender || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500 dark:text-gray-400">Last Updated:</span>
                              <p>{formatDate(student.last_updated)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Students Found</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  No students found matching "{searchQuery}". Try searching with a different name or hall ticket number.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold mb-6">Quick Actions</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <User className="w-4 h-4" />
              <span>Login to KMIT</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
