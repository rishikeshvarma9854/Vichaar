import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import apiClient from '../lib/api'
import { ArrowLeft, GraduationCap, BookOpen, Calendar, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

interface InternalResult {
  year: string
  semesters: Array<{
    semester: string
    internal_types: Array<{
      internalType: string
      subjects: Array<{
        subject: string
        type: 'sub' | 'lab'
        assignment: number
        subjective: number
        quiz: number
        dtd: number
        test: number
        total: number
      }>
    }>
  }>
}

interface SemesterResult {
  year: string
  semester: string
  subjects: Array<{
    sno: number
    subjectName: string
    gradePoints: number
    grade: string
    credits: number
  }>
  sgpa: number
  creditsAcquired: number
}

export default function ResultsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'internal' | 'semester'>('internal')
  const [internalResults, setInternalResults] = useState<InternalResult[]>([])
  const [semesterResults, setSemesterResults] = useState<SemesterResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadResults()
  }, [user, navigate])

  const loadResults = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load internal results
      const internalResponse = await apiClient.getInternalResults()
      if (internalResponse.success && internalResponse.data?.payload) {
        setInternalResults(internalResponse.data.payload)
      }

      // Load semester results
      const semesterResponse = await apiClient.getSemesterResults()
      if (semesterResponse.success && semesterResponse.data?.payload) {
        setSemesterResults(semesterResponse.data.payload)
      }

    } catch (error: any) {
      console.error('Failed to load results:', error)
      setError(error.message || 'Failed to load results')
      toast.error('Failed to load results')
    } finally {
      setIsLoading(false)
    }
  }

  const renderInternalResults = () => {
    if (internalResults.length === 0) {
      return (
        <div className="text-center py-8">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No internal assessment results available</p>
        </div>
      )
    }

    return internalResults.map((yearData, yearIndex) => (
      <div key={yearIndex} className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Year {yearData.year}
        </h3>
        
        {yearData.semesters.map((semesterData, semesterIndex) => (
          <div key={semesterIndex} className="mb-6">
            <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
              Semester {semesterData.semester}
            </h4>
            
            {semesterData.internal_types.map((internalType, typeIndex) => (
              <div key={typeIndex} className="mb-4">
                <h5 className="text-md font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {internalType.internalType} Internal Assessment
                </h5>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                          SUBJECT
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          TYPE
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          ASSIGNMENT (10)
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          SUBJECTIVE (20)
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          QUIZ (10)
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          DTD
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          TEST
                        </th>
                        <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          TOTAL (40)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {internalType.subjects?.map((subject, subjectIndex) => (
                        <tr key={subjectIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-800 dark:text-gray-200">
                            {subject.subject}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm text-gray-800 dark:text-gray-200">
                            {subject.type.toUpperCase()}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm text-gray-800 dark:text-gray-200">
                            {subject.assignment}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm text-gray-800 dark:text-gray-200">
                            {subject.subjective}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm text-gray-800 dark:text-gray-200">
                            {subject.quiz}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm text-gray-800 dark:text-gray-200">
                            {subject.dtd}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm text-gray-800 dark:text-gray-200">
                            {subject.test}
                          </td>
                          <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-gray-800 dark:text-gray-200">
                            {subject.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    ))
  }

  const renderSemesterResults = () => {
    if (semesterResults.length === 0) {
      return (
        <div className="text-center py-8">
          <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No semester results available</p>
        </div>
      )
    }

    return semesterResults.map((semester, index) => (
      <div key={index} className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Year {semester.year}, Semester {semester.semester}
        </h3>
        
        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  SNO
                </th>
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  SUBJECT NAME
                </th>
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  GRADE POINTS
                </th>
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  GRADE
                </th>
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  CREDITS
                </th>
              </tr>
            </thead>
            <tbody>
              {semester.subjects?.map((subject, subjectIndex) => (
                <tr key={subjectIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm text-gray-800 dark:text-gray-200">
                    {subject.sno}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-800 dark:text-gray-200">
                    {subject.subjectName}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm text-gray-800 dark:text-gray-200">
                    {subject.gradePoints}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm font-medium text-gray-800 dark:text-gray-200">
                    {subject.grade}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-sm text-gray-800 dark:text-gray-200">
                    {subject.credits}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-2 rounded-lg">
            <span className="font-medium">SGPA: {semester.sgpa}</span>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Credits Acquired: {semester.creditsAcquired}
          </div>
        </div>
      </div>
    ))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading results...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Academic Results
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-8">
          <button
            onClick={() => setActiveTab('internal')}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition-colors ${
              activeTab === 'internal'
                ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <BookOpen className="w-5 h-5" />
              <span>Internal Assessment</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('semester')}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition-colors ${
              activeTab === 'semester'
                ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <GraduationCap className="w-5 h-5" />
              <span>Semester Results</span>
            </div>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
            <button
              onClick={loadResults}
              className="mt-2 text-sm text-red-600 dark:text-red-300 hover:text-red-800 dark:hover:text-red-100 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {activeTab === 'internal' ? renderInternalResults() : renderSemesterResults()}
        </div>
      </div>
    </div>
  )
}
