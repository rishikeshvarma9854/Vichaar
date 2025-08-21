import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { 
  GraduationCap, Moon, Sun, User, Calendar, 
  BarChart3, Clock, QrCode, ArrowLeft, Zap, X, Check, ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import { optimizedApiClient } from '@/lib/optimizedApi'
import { StudentData } from '@/lib/api'
import { supabaseDB, supabase } from '@/lib/supabase'

// Helper function to convert numbers to ordinal format
const getOrdinalSuffix = (num: number): string => {
  if (num >= 11 && num <= 13) return 'th'
  switch (num % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

// Helper function to update profile in database with complete information
const updateProfileInDatabase = async (profileData: any, fullPayload: any) => {
  try {
    console.log('🚀 ===== updateProfileInDatabase FUNCTION START =====')
    console.log('🚀 updateProfileInDatabase function called!')
    console.log('🚀 profileData received:', profileData)
    console.log('🚀 fullPayload received:', fullPayload)
    
    console.log('💾 Updating profile in database with complete information...')
    
    // Extract the CORRECT mobile number from the KMIT API response
    // This should be the student's actual mobile number, not the login number
    let mobileNumber = null
    
    // Priority 1: Use mobile number from KMIT API response (most reliable)
    if (fullPayload?.student?.phone) {
      mobileNumber = fullPayload.student.phone
      console.log('📱 PRIORITY: Found mobile number from KMIT API response:', mobileNumber)
    } else if (fullPayload?.phone) {
      mobileNumber = fullPayload.phone
      console.log('📱 SECOND PRIORITY: Found mobile number from KMIT API phone:', mobileNumber)
    } else if (profileData?.phone) {
      mobileNumber = profileData.phone
      console.log('📱 THIRD PRIORITY: Found mobile number from profileData.phone:', mobileNumber)
    } else {
      // Fallback: Use currentStudent from localStorage (for backward compatibility)
      const currentStudent = localStorage.getItem('currentStudent')
      if (currentStudent) {
        try {
          const parsed = JSON.parse(currentStudent)
          mobileNumber = parsed.mobile_number || parsed.phone
          console.log('📱 Found mobile number from currentStudent fallback:', mobileNumber)
        } catch (e) {
          console.error('Failed to parse currentStudent:', e)
        }
      }
    }
    
    if (!mobileNumber) {
      console.error('❌ No mobile number found for profile update!')
      return
    }
    
    console.log('📱 Using mobile number for profile update:', mobileNumber)
    
    // DEBUG: Check if profile already exists
    console.log('🔍 Checking if profile already exists for mobile number:', mobileNumber)
    const existingProfile = await supabaseDB.getProfile(mobileNumber)
    console.log('🔍 Existing profile check result:', existingProfile)
    
    // DEBUG: Check if credentials exist
    console.log('🔍 Checking if credentials exist for mobile number:', mobileNumber)
    const existingCredentials = await supabaseDB.getCredentials(mobileNumber)
    console.log('🔍 Existing credentials check result:', existingCredentials)
    
    // CRITICAL: Ensure credentials exist first (required for foreign key constraint)
    if (!existingCredentials.data) {
      console.log('🔐 No credentials found for mobile number, creating dummy credentials...')
      // Create dummy credentials to satisfy foreign key constraint
      // We'll use a placeholder password since we don't have the actual password here
      const credentialsResult = await supabaseDB.insertCredentials(mobileNumber, 'placeholder_password')
      console.log('🔐 Credentials creation result:', credentialsResult)
      
      if (credentialsResult.error) {
        console.error('❌ Failed to create credentials:', credentialsResult.error)
        return
      }
      console.log('✅ Credentials created successfully')
    } else {
      console.log('✅ Credentials already exist for mobile number:', mobileNumber)
    }
    
    // Create complete profile data
    const completeProfileData = {
      mobile_number: mobileNumber, // Add mobile_number to the profile data
      hall_ticket: profileData.htno || '',
      name: profileData.name || '',
      branch: profileData.branch?.name || '',
      year: profileData.currentyear?.toString() || '',
      semester: profileData.currentsemester?.toString() || '',
      student_image: fullPayload.studentimage || null,
      qr_code: fullPayload.qrcode || null,
      profile_data: fullPayload
    }
    
    console.log('📝 Complete profile data to update:', completeProfileData)
    console.log('📱 Updating profile for mobile number:', mobileNumber)
    
    // Update the profile in database
    console.log('🔍 Calling supabaseDB.updateProfile with:', { mobileNumber, completeProfileData })
    
    try {
      const updateResult = await supabaseDB.updateProfile(mobileNumber, completeProfileData)
      console.log('🔍 Update result:', updateResult)
      
      if (updateResult.error) {
        console.error('❌ Failed to update profile in database:', updateResult.error)
        toast.error('Profile update failed')
      } else if (updateResult.data) {
        console.log('✅ Profile updated in database successfully')
        console.log('🔍 Updated data:', updateResult.data)
        toast.success('Profile updated in database!')
      } else {
        console.log('⚠️ Profile update returned no data and no error')
        toast.error('Profile update failed')
      }
    } catch (updateError) {
      console.error('❌ Error calling supabaseDB.updateProfile:', updateError)
      toast.error('Profile update failed')
    }
    
    console.log('🚀 ===== updateProfileInDatabase FUNCTION END =====')
  } catch (error) {
    console.error('❌ Error in updateProfileInDatabase:', error)
    // Don't fail the main flow if database update fails
  }
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated } = useAuth()
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [showAttendanceDetails, setShowAttendanceDetails] = useState(false)
  const [attendanceDetails, setAttendanceDetails] = useState<any>(null)
  const [subjectAttendance, setSubjectAttendance] = useState<any>(null)
  
  const [showResultsDetails, setShowResultsDetails] = useState(false)
  const [activeResultsTab, setActiveResultsTab] = useState<'internal' | 'semester'>('internal')
  const [internalResults, setInternalResults] = useState<any>(null)
  const [semesterResults, setSemesterResults] = useState<any>(null)
  const [showTimetableDetails, setShowTimetableDetails] = useState(false)
  const [timetableData, setTimetableData] = useState<any>(null)
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set())
  const [showNetraQR, setShowNetraQR] = useState(false)

  // Debug: Monitor results state changes
  useEffect(() => {
    console.log('🔄 Results state changed:')
    console.log('🔄 internalResults:', internalResults)
    console.log('🔄 semesterResults:', semesterResults)
  }, [internalResults, semesterResults])

  // Debug: Monitor attendanceDetails state changes
  useEffect(() => {
    console.log('🔄 attendanceDetails state changed to:', attendanceDetails)
    if (attendanceDetails?.payload?.attendanceDetails?.[0]) {
      console.log('🔄 First entry data in attendanceDetails:', attendanceDetails.payload.attendanceDetails[0])
      console.log('🔄 First entry periods:', attendanceDetails.payload.attendanceDetails[0].periods)
    }
    
    // Find the actual "Today" entry
    const todayEntry = attendanceDetails?.payload?.attendanceDetails?.find((day: any) => day.date === "Today")
    if (todayEntry) {
      console.log('🔄 ACTUAL Today entry found:', todayEntry)
      console.log('🔄 ACTUAL Today periods:', todayEntry.periods)
      console.log('🔄 ACTUAL Today period statuses:', todayEntry.periods?.map((p: any) => ({ period: p.period_no, status: p.status })))
    }
  }, [attendanceDetails])

  // Debug: Monitor all state changes
  useEffect(() => {
    console.log('🔄 ALL STATE CHANGES:')
    console.log('🔄 studentData:', studentData)
    console.log('🔄 attendanceDetails:', attendanceDetails)
    console.log('🔄 subjectAttendance:', subjectAttendance)
    console.log('🔄 isLoading:', isLoading)
  }, [studentData, attendanceDetails, subjectAttendance, isLoading])





  // Handle attendance button click
  const handleAttendanceClick = async () => {
    if (!optimizedApiClient.isAuthenticated()) {
      toast.error('Please login first')
      return
    }

    // Show the modal and load fresh attendance data
    setShowAttendanceDetails(true)
    
    // Load fresh attendance data if not already loaded
    if (!attendanceDetails) {
      try {
        console.log('🔍 Fetching fresh attendance data...')
        const attendanceData = await optimizedApiClient.getAttendance()
        setAttendanceDetails(attendanceData)
        console.log('✅ Attendance data loaded:', attendanceData)
      } catch (error) {
        console.error('❌ Failed to fetch attendance:', error)
        toast.error('Failed to load attendance data')
      }
    }
  }

  // Handle results button click
  const handleResultsClick = async () => {
    if (!optimizedApiClient.isAuthenticated()) {
      toast.error('Please login first')
      return
    }

    // Show the modal and load results
    setShowResultsDetails(true)
    loadResultsData()
  }

  // Load results data
  const loadResultsData = async () => {
    try {
      // Load internal results
      const internalResponse = await optimizedApiClient.getInternalResults()
      if (internalResponse.success && internalResponse.data?.payload) {
        setInternalResults(internalResponse.data.payload)
        console.log('✅ Internal results loaded:', internalResponse.data.payload)
      }

      // Load semester results
      const semesterResponse = await optimizedApiClient.getSemesterResults()
      if (semesterResponse.success && semesterResponse.data?.payload) {
        setSemesterResults(semesterResponse.data.payload)
        console.log('✅ Semester results loaded:', semesterResponse.data.payload)
      }
      
      console.log('📊 Results loading completed')
    } catch (error: any) {
      console.error('Failed to load results:', error)
      toast.error('Failed to load results')
    }
  }

  // Handle timetable button click
  const handleTimetableClick = async () => {
    if (!optimizedApiClient.isAuthenticated()) {
      toast.error('Please login first')
      return
    }

    // Show the modal and load timetable
    setShowTimetableDetails(true)
    loadTimetableData()
  }

  // Handle Netra QR button click
  const handleNetraQRClick = () => {
    if (!optimizedApiClient.isAuthenticated()) {
      toast.error('Please login first')
      return
    }

    // Show the modal (QR data is already loaded with student profile)
    setShowNetraQR(true)
  }

  // Download QR code
  const downloadQRCode = () => {
    if (!studentData?.qrCode) {
      toast.error('No QR code available')
      return
    }

    try {
      // Convert base64 to Blob
      const base64Data = studentData.qrCode.split(',')[1] // Remove data:image/png;base64, prefix
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `netra-qr-${studentData.hallTicket}.png`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('QR Code downloaded successfully!')
    } catch (error) {
      console.error('Error downloading QR code:', error)
      toast.error('Failed to download QR code')
    }
  }

  // Share QR code
  const shareQRCode = async () => {
    if (!studentData?.qrCode) {
      toast.error('No QR code available')
      return
    }

    try {
      // Convert base64 to Blob
      const base64Data = studentData.qrCode.split(',')[1] // Remove data:image/png;base64, prefix
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })
      
      // Create file from blob
      const file = new File([blob], `netra-qr-${studentData.hallTicket}.png`, { type: 'image/png' })
      
      // Try native sharing with file
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Netra QR Code',
          text: `QR Code for ${studentData.name} (${studentData.hallTicket})`,
          files: [file]
        })
        toast.success('QR Code shared successfully!')
      } else {
        // Fallback: show share options
        showShareOptions(file)
      }
    } catch (error) {
      console.error('Error sharing:', error)
      toast.error('Failed to share QR code')
    }
  }

  // Show share options when native sharing is not available
  const showShareOptions = (file: File) => {
    // Create a temporary download link and trigger it
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success('QR Code downloaded! You can now share the file through your preferred app.')
  }



  // Load timetable data
  const loadTimetableData = async () => {
    try {
      const timetableResponse = await optimizedApiClient.getTimetable()
      if (timetableResponse.success && timetableResponse.data?.payload) {
        setTimetableData(timetableResponse.data.payload)
        
        // Find current day and expand it by default
        const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
        const currentDayIndex: number = timetableResponse.data.payload.findIndex((day: any) =>
          day.dayname === currentDay
        )
        
        if (currentDayIndex !== -1) {
          setExpandedDays(new Set([currentDayIndex]))
        }
        
        console.log('✅ Timetable loaded:', timetableResponse.data.payload)
        console.log('📅 Current day:', currentDay, 'at index:', currentDayIndex)
      }
    } catch (error: any) {
      console.error('Failed to load timetable:', error)
      toast.error('Failed to load timetable')
    }
  }

  // Check authentication and fetch data on mount
  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      console.log('Checking authentication...')
      

      
      // Check both context authentication and KMIT API authentication
      const contextAuthenticated = isAuthenticated
      const kmitAuthenticated = optimizedApiClient.isAuthenticated()
      
      console.log('🔐 Authentication state check:')
      console.log('  - Context isAuthenticated:', contextAuthenticated)
      console.log('  - KMIT API isAuthenticated:', kmitAuthenticated)
      
      if (contextAuthenticated || kmitAuthenticated) {
        console.log('✅ User is authenticated (either context or KMIT API)')
        const currentToken = localStorage.getItem('kmit_access_token')
        console.log('Current token:', currentToken)
        
        if (currentToken) {
          console.log('User authenticated, fetching profile...')
          try {
            // Fetch student profile
            console.log('🔄 Starting to fetch student profile...')
            const profile = await optimizedApiClient.getStudentProfile()
            console.log('✅ Student profile API response received:', profile)
            
            if (profile && profile.payload) {
              console.log('📋 Profile response structure:', {
                hasSuccess: profile.success,
                hasData: !!profile.data,
                hasPayload: !!profile.payload,
                hasStudent: !!profile.payload.student,
                studentImageField: profile.payload.studentimage
              })
              
              console.log('🔍 Full profile object:', profile)
              console.log('🔍 profile.payload:', profile.payload)
              console.log('🔍 profile.payload?.student:', profile.payload?.student)
              console.log('🔍 profile.payload?.studentimage:', profile.payload?.studentimage)
              
              if (profile.payload.student) {
                console.log('✅ Profile data extracted successfully:', profile.payload.student)
                
                // Convert KMIT API data to our format
                const studentData: StudentData = {
                  name: profile.payload.student.name || 'N/A',
                  hallTicket: profile.payload.student.htno || 'N/A',
                  branch: profile.payload.student.branch?.name || 'N/A',
                  year: profile.payload.student.currentyear ? `${profile.payload.student.currentyear}${getOrdinalSuffix(Number(profile.payload.student.currentyear))} Year` : 'N/A',
                  semester: profile.payload.student.currentsemester ? `${profile.payload.student.currentsemester}${getOrdinalSuffix(Number(profile.payload.student.currentsemester))} Semester` : 'N/A',
                  studentImage: profile.payload.studentimage || undefined,
                  qrCode: profile.payload.qrcode || undefined,
                  attendance: {
                    overall: 0,
                    present: 0,
                    absent: 0,
                    noSessions: 0,
                    sessions: []
                  },
                  results: {
                    cgpa: 0
                  }
                }
                
                console.log('✅ Student data converted successfully:', studentData)
                console.log('📸 Student image data:', profile.payload.studentimage)
                console.log('📸 Student image available:', profile.payload.studentimage ? profile.payload.studentimage.substring(0, 100) + '...' : 'Not available')
                
                setStudentData(studentData)
                
                // Update profile in database with complete information
                console.log('🔄 ===== PROFILE UPDATE SECTION START =====')
                console.log('🔄 About to call updateProfileInDatabase...')
                console.log('🔄 profileData:', profile.payload.student)
                console.log('🔄 profile.payload:', profile.payload)
                console.log('🔄 Function exists?', typeof updateProfileInDatabase)
                console.log('🔄 Calling updateProfileInDatabase now...')
                
                await updateProfileInDatabase(profile.payload.student, profile.payload)
                
                console.log('🔄 ===== PROFILE UPDATE SECTION END =====')
                
                // Now fetch attendance data
                console.log('🔄 ===== ATTENDANCE DATA LOADING START =====')
                try {
                  const attendanceResponse = await optimizedApiClient.getAttendance()
                  if (attendanceResponse.success && attendanceResponse.data?.payload) {
                    const kmitData = attendanceResponse.data.payload
                    console.log('✅ KMIT attendance data loaded:', kmitData)
                    
                    // Convert KMIT attendance format to our format
                    const realAttendance = {
                      overall: parseFloat(kmitData.overallAttendance) || 0,
                      present: 0,
                      absent: 0,
                      noSessions: 0,
                      sessions: kmitData.attendanceDetails || []
                    }
                    
                    // Calculate present/absent from TODAY'S attendance only
                    if (kmitData.attendanceDetails && kmitData.attendanceDetails.length > 0) {
                      const todayData = kmitData.attendanceDetails.find((day: any) => day.date === "Today")
                      console.log('📅 Today data:', todayData)
                      
                      if (todayData && todayData.periods) {
                        console.log('📅 Today\'s attendance data:', todayData)
                        console.log('📚 Today\'s periods:', todayData.periods)
                        
                        // Count present/absent for today
                        realAttendance.present = todayData.periods.filter((period: any) => 
                          period.status === 1
                        ).length
                        realAttendance.absent = todayData.periods.filter((period: any) => 
                          period.status === 0
                        ).length
                        realAttendance.noSessions = todayData.periods.filter((period: any) => 
                          period.status === 2
                        ).length
                        
                        console.log('📊 Today\'s counts:', {
                          present: realAttendance.present,
                          absent: realAttendance.absent,
                          noSessions: realAttendance.noSessions
                        })
                      }
                    }
                    
                    // Store the full KMIT attendance data for the modal
                    setAttendanceDetails(attendanceResponse.data)
                    
                    // Update student data with real attendance
                    setStudentData(prevData => {
                      if (prevData) {
                        return {
                          ...prevData,
                          attendance: realAttendance
                        }
                      }
                      return prevData
                    })
                    
                    console.log('🎯 Updated student data with REAL KMIT attendance')
                    toast.success(`Loaded attendance: ${realAttendance.overall}%`)
                  } else {
                    console.warn('⚠️ No attendance data in response')
                  }
                } catch (attendanceError) {
                  console.error('❌ Failed to fetch attendance:', attendanceError)
                  toast.error('Could not fetch attendance data')
                }
                
                console.log('🔄 ===== ATTENDANCE DATA LOADING END =====')
                
                // Now fetch subject attendance data
                console.log('🔄 ===== SUBJECT ATTENDANCE LOADING START =====')
                try {
                  const subjectResponse = await optimizedApiClient.getSubjectAttendance()
                  if (subjectResponse.success) {
                    setSubjectAttendance(subjectResponse.data)
                    console.log('✅ Subject attendance loaded:', subjectResponse.data)
                  }
                } catch (subjectError) {
                  console.error('❌ Failed to fetch subject attendance:', subjectError)
                }
                console.log('🔄 ===== SUBJECT ATTENDANCE LOADING END =====')
                
              } else {
                console.error('❌ No student data in profile response')
              }
            } else {
              console.error('❌ Invalid profile response structure')
            }
          } catch (error) {
            console.error('❌ Error fetching profile:', error)
          }
        } else {
          console.log('No access token found')
        }
      } else {
        console.log('❌ User not authenticated in either context or KMIT API')
        console.log('🔍 Available tokens in localStorage:')
        console.log('  - kmit_access_token:', localStorage.getItem('kmit_access_token') ? 'Present' : 'Missing')
        console.log('  - kmit_refresh_token:', localStorage.getItem('kmit_refresh_token') ? 'Present' : 'Missing')
        console.log('  - kmit_student_id:', localStorage.getItem('kmit_student_id') ? 'Present' : 'Missing')
      }
      
      setIsLoading(false)
    }
    
    checkAuthAndFetchData()
  }, [isAuthenticated])



  const handleBack = () => {
    navigate('/')
  }




  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading student data...</p>
        </div>
      </div>
    )
  }

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">No student data found</p>
          <button
            onClick={handleBack}
            className="btn-primary"
          >
            Back to Search
          </button>
        </div>
      </div>
    )
  }

  const attendance = studentData.attendance

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="min-h-screen w-full max-w-full p-4 box-border">
        {/* Header - Fixed for mobile */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          {/* Left side - Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">KMIT VICHAAR</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Student Information Portal</p>
              </div>
            </div>
          </div>
          
          {/* Right side - Status and Back Button */}
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Connected to KMIT</span>
              <span className="text-xs sm:text-sm font-medium sm:hidden">KMIT</span>
            </div>
            
            {/* Back to Search - Fixed for mobile */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Search</span>
              <span className="sm:hidden">Back</span>
            </button>
          </div>
        </div>



        {/* Main Content Grid - Fixed for mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Student Profile */}
          <div className="card">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-4 sm:mb-6 flex items-center">
              <User className="w-5 h-5 mr-2 text-primary-600" />
              Student Profile
            </h3>
            
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Profile Picture */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-primary-200 dark:border-primary-700 shadow-lg">
                {studentData?.studentImage ? (
                  <img 
                    src={studentData.studentImage} 
                    alt={`${studentData.name}'s Profile Picture`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center">
                    <User className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                  </div>
                )}
              </div>
              
              {/* Student Name and Info */}
              <div className="text-center sm:text-left space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                  {studentData.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  {studentData.hallTicket}
                </p>
                
                {/* Profile Information - Stacked on mobile */}
                <div className="space-y-2 text-sm sm:text-base">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <span className="text-gray-600 dark:text-gray-400">Branch:</span>
                    <span className="font-medium text-gray-800 dark:text-white">{studentData.branch}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <span className="text-gray-600 dark:text-gray-400">Year:</span>
                    <span className="font-medium text-gray-800 dark:text-white">{studentData.year}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <span className="text-gray-600 dark:text-gray-400">Semester:</span>
                    <span className="font-medium text-gray-800 dark:text-white">{studentData.semester}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Overview - Fixed for mobile */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary-600" />
                Attendance Overview
              </h3>
            </div>

            {/* Overall Attendance */}
            <div className="mb-4 sm:mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Attendance</span>
                <span className="text-base sm:text-lg font-bold text-green-600">{attendance?.overall || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3">
                <div 
                  className="bg-green-500 h-2 sm:h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${attendance?.overall || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Today's Sessions */}
            <div className="mb-4 sm:mb-6">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Today's Sessions</h4>
              
              {!attendanceDetails?.payload?.attendanceDetails?.find((day: any) => day.date === "Today") ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  Loading attendance data...
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {Array.from({ length: 7 }, (_, index) => {
                    // Find the actual "Today" entry in the attendance details
                    const todayData = attendanceDetails?.payload?.attendanceDetails?.find((day: any) => day.date === "Today")
                    const period = todayData?.periods?.[index]
                    let color = 'bg-gray-300 dark:bg-gray-600'
                    let icon = null
                    
                    console.log(`Dashboard Period ${index + 1}:`, period)
                    console.log(`Dashboard Today data:`, todayData)
                    console.log(`Dashboard attendanceDetails state:`, attendanceDetails)
                    console.log(`Dashboard attendance state:`, attendance)
                    
                    if (period) {
                      console.log(`Period ${index + 1} status:`, period.status, typeof period.status)
                      // Check for different possible status values
                      if (period.status === 1) {
                        color = 'bg-green-500'
                        icon = <Check className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                        console.log(`Period ${index + 1} marked as PRESENT`)
                      } else if (period.status === 0) {
                        color = 'bg-red-500'
                        icon = <X className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                        console.log(`Period ${index + 1} marked as ABSENT`)
                      } else if (period.status === 2) {
                        color = 'bg-gray-300 dark:bg-gray-600'
                        icon = null
                        console.log(`Period ${index + 1} marked as NO SESSION`)
                      } else {
                        console.log(`Period ${index + 1} status unknown:`, period.status)
                      }
                    } else {
                      console.log(`No period data for index ${index}`)
                    }
                    
                    return (
                      <div key={index} className="flex flex-col items-center">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${color} flex items-center justify-center mb-1`}>
                          {icon}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {period?.period_no ? `P${period.period_no}` : `P${index + 1}`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions - Fixed for mobile */}
        <div className="mt-6 sm:mt-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <button
              onClick={handleAttendanceClick}
              className="p-3 sm:p-4 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors flex flex-col items-center space-y-2"
            >
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm font-medium">Attendance</span>
            </button>
            <button 
              onClick={handleResultsClick}
              className="p-3 sm:p-4 bg-green-500 hover:bg-green-600 rounded-lg text-white transition-colors flex flex-col items-center space-y-2"
            >
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm font-medium">Results</span>
            </button>
            <button 
              onClick={handleTimetableClick}
              className="p-3 sm:p-4 bg-orange-500 hover:bg-orange-600 rounded-lg text-white transition-colors flex flex-col items-center space-y-2"
            >
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm font-medium">Timetable</span>
            </button>
            <button 
              onClick={handleNetraQRClick}
              className="p-3 sm:p-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors flex flex-col items-center space-y-2"
            >
              <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm font-medium">Netra QR</span>
            </button>
          </div>
        </div>

        {/* Attendance Details Modal */}
        {showAttendanceDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Attendance Dashboard</h2>
                  <button
                    onClick={() => setShowAttendanceDetails(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Today Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Today</h3>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                  

                  
                  {!attendanceDetails?.payload?.attendanceDetails?.find((day: any) => day.date === "Today") ? (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      Loading attendance data...
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-3">
                      {Array.from({ length: 7 }, (_, index) => {
                        // Find the actual "Today" entry in the attendance details
                        const todayData = attendanceDetails?.payload?.attendanceDetails?.find((day: any) => day.date === "Today")
                        const period = todayData?.periods?.[index]
                        let color = 'bg-gray-300 dark:bg-gray-600'
                        let icon = null
                        
                        console.log(`Modal Period ${index + 1}:`, period)
                        console.log(`Modal Today data:`, todayData)
                        console.log(`Modal attendanceDetails state:`, attendanceDetails)
                        
                        if (period) {
                          console.log(`Modal Period ${index + 1} status:`, period.status, typeof period.status)
                          // Check for different possible status values
                          if (period.status === 1) {
                            color = 'bg-green-500'
                            icon = <Check className="w-4 h-4 text-white" />
                            console.log(`Modal Period ${index + 1} marked as PRESENT`)
                          } else if (period.status === 0) {
                            color = 'bg-red-500'
                            icon = <X className="w-4 h-4 text-white" />
                            console.log(`Modal Period ${index + 1} marked as ABSENT`)
                          } else if (period.status === 2) {
                            color = 'bg-gray-300 dark:bg-gray-600'
                            icon = null
                            console.log(`Modal Period ${index + 1} marked as NO SESSION`)
                          } else {
                            console.log(`Modal Period ${index + 1} status unknown:`, period.status)
                          }
                        } else {
                          console.log(`Modal: No period data for index ${index}`)
                        }
                        
                        return (
                          <div key={index} className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center mb-2`}>
                              {icon}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {period?.period_no ? `P${period.period_no}` : `P${index + 1}`}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Last 2 Weeks Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Last 2 Weeks</h3>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 px-4 font-medium">Date</th>
                          <th className="text-left py-2 px-4 font-medium">Sessions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceDetails?.payload?.attendanceDetails?.slice(0, 14).map((day: any, index: number) => {
                          console.log(`Day ${index}:`, day)
                          console.log(`Day ${index} periods:`, day.periods)
                          
                          return (
                            <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-3 px-4 font-medium">{day.date}</td>
                              <td className="py-3 px-4">
                                <div className="flex space-x-1">
                                  {Array.from({ length: 7 }, (_, periodIndex) => {
                                    const period = day.periods?.[periodIndex]
                                    let color = 'bg-gray-300 dark:bg-gray-600'
                                    let icon = null
                                    
                                    if (period) {
                                      console.log(`Day ${day.date} Period ${periodIndex + 1}:`, period)
                                      console.log(`Day ${day.date} Period ${periodIndex + 1} status:`, period.status, typeof period.status)
                                      // Check for different possible status values
                                      if (period.status === 1) {
                                        color = 'bg-green-500'
                                        icon = <Check className="w-3 h-3 text-white" />
                                        console.log(`Day ${day.date} Period ${periodIndex + 1} marked as PRESENT`)
                                      } else if (period.status === 0) {
                                        color = 'bg-red-500'
                                        icon = <X className="w-3 h-3 text-white" />
                                        console.log(`Day ${day.date} Period ${periodIndex + 1} marked as ABSENT`)
                                      } else if (period.status === 2) {
                                        color = 'bg-gray-300 dark:bg-gray-600'
                                        icon = null
                                        console.log(`Day ${day.date} Period ${periodIndex + 1} marked as NO SESSION`)
                                      } else {
                                        console.log(`Day ${day.date} Period ${periodIndex + 1} status unknown:`, period.status)
                                      }
                                    } else {
                                      console.log(`Day ${day.date}: No period data for index ${periodIndex}`)
                                    }
                                    
                                    return (
                                      <div key={periodIndex} className={`w-6 h-6 rounded-full ${color} flex items-center justify-center`}>
                                        {icon}
                                      </div>
                                    )
                                  })}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Overall Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Overall</h3>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                  
                  {/* Overall Attendance */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Attendance</span>
                      <span className="text-lg font-bold text-green-600">{attendanceDetails?.payload?.overallAttendance || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${attendanceDetails?.payload?.overallAttendance || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Theory Attendance Chart */}
                  {subjectAttendance && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-lg font-semibold mb-4">Theory</h4>
                        <div className="space-y-4">
                          {subjectAttendance.payload?.map((subject: any) => {
                            // Show theory subjects (those without "LAB" in name)
                            if (!subject.subjectName?.toUpperCase().includes('LAB')) {
                              return (
                                <div key={subject.subjectName} className="flex items-center space-x-3">
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-sm font-medium">{subject.subjectName}</span>
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{subject.attendancePercentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                      <div 
                                        className="bg-orange-500 h-2 rounded-full" 
                                        style={{ width: `${subject.attendancePercentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              )
                            }
                            return null
                          })}
                        </div>
                      </div>

                      {/* Lab Attendance Chart */}
                      <div>
                        <h4 className="text-lg font-semibold mb-4">Lab</h4>
                        <div className="space-y-4">
                          {subjectAttendance.payload?.map((subject: any) => {
                            // Show lab subjects (those with "LAB" in name)
                            if (subject.subjectName?.toUpperCase().includes('LAB')) {
                              return (
                                <div key={subject.subjectName} className="flex items-center space-x-3">
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-sm font-medium">{subject.subjectName}</span>
                                      <span className="text-sm text-gray-600 dark:text-gray-400">{subject.attendancePercentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                      <div 
                                        className="bg-orange-500 h-2 rounded-full" 
                                        style={{ width: `${subject.attendancePercentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              )
                            }
                            return null
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Details Modal */}
        {showResultsDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Academic Results</h2>
                  <button
                    onClick={() => setShowResultsDetails(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6">
                  <button
                    onClick={() => setActiveResultsTab('internal')}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                      activeResultsTab === 'internal'
                        ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>Internal Assessment</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveResultsTab('semester')}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                      activeResultsTab === 'semester'
                        ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>Semester Results</span>
                    </div>
                  </button>
                </div>

                {/* Results Content */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  {activeResultsTab === 'internal' ? (
                    <div>
                      {internalResults ? (
                        <div>

                          {internalResults.map((yearData: any, yearIndex: number) => (
                            <div key={yearIndex} className="mb-6">
                              <h3 className="text-lg font-semibold mb-3">Year {yearData.year}</h3>
                              {yearData.semesters?.map((semesterData: any, semesterIndex: number) => (
                                <div key={semesterIndex} className="mb-4 ml-4">
                                  <h4 className="text-md font-medium mb-2">Semester {semesterData.semester}</h4>
                                  {semesterData.internal_types?.map((internalType: any, typeIndex: number) => (
                                    <div key={typeIndex} className="mb-3 ml-4">
                                      <h5 className="text-sm font-medium mb-2">{internalType.internalType} Internal Assessment</h5>
                                      <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-xs">
                                          <thead>
                                            <tr className="bg-gray-100 dark:bg-gray-700">
                                              <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">SUBJECT</th>
                                              <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">TYPE</th>
                                              <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">ASSIGNMENT</th>
                                              <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">SUBJECTIVE</th>
                                              <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">QUIZ</th>
                                              <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">DTD</th>
                                              <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">TEST</th>
                                              <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">TOTAL</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {internalType.subjects?.map((subject: any, subjectIndex: number) => {
                                              // Extract marks from types array based on subject type
                                              let assignmentMarks = 0
                                              let subjectiveMarks = 0
                                              let quizMarks = 0
                                              let dtdMarks = 0
                                              let testMarks = 0
                                              
                                              if (subject.subject_type === "LAB") {
                                                // For LAB subjects
                                                assignmentMarks = 0 // Assignment not used for LAB
                                                subjectiveMarks = 0 // Subjective not used for LAB
                                                quizMarks = 0 // Quiz not used for LAB
                                                dtdMarks = subject.types?.find((t: any) => t.type === "Assignment")?.marks || 0 // Assignment → DTD
                                                testMarks = subject.types?.find((t: any) => t.type === "Descriptive")?.marks || 0 // Descriptive → TEST
                                              } else {
                                                // For THEORY subjects
                                                const assignmentType = subject.types?.find((t: any) => t.type === "Assignment")?.marks || 0
                                                const vivaType = subject.types?.find((t: any) => t.type === "Viva")?.marks || 0
                                                assignmentMarks = assignmentType + vivaType // Assignment + Viva → ASSIGNMENT
                                                subjectiveMarks = subject.types?.find((t: any) => t.type === "Descriptive")?.marks || 0 // Descriptive → SUBJECTIVE
                                                quizMarks = subject.types?.find((t: any) => t.type === "Objective")?.marks || 0 // Objective → QUIZ
                                                dtdMarks = 0 // DTD not used for THEORY
                                                testMarks = 0 // Test not used for THEORY
                                              }
                                              
                                              return (
                                                <tr key={subjectIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{subject.name}</td>
                                                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{subject.subject_type?.toUpperCase()}</td>
                                                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{assignmentMarks}</td>
                                                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{subjectiveMarks}</td>
                                                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{quizMarks}</td>
                                                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{dtdMarks}</td>
                                                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{testMarks}</td>
                                                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center font-medium">{subject.totalMarks || '0'}</td>
                                                </tr>
                                              )
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">Loading internal assessment results...</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {semesterResults ? (
                        <div>
                          {Object.entries(semesterResults.yearlyResults || {}).map(([year, yearData]: [string, any]) => (
                            <div key={year} className="mb-8">
                              <h3 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">{year}</h3>
                              {Object.entries(yearData).map(([semester, semesterData]: [string, any]) => (
                                <div key={semester} className="mb-6 ml-4 border-l-2 border-gray-300 dark:border-gray-600 pl-4">
                                  <h4 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">{semester}</h4>
                                  
                                  {/* SGPA Summary */}
                                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center space-x-4">
                                        <div className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                                          SGPA: {semesterData.SGPA?.sgpa || 'N/A'}
                                        </div>
                                        <div className="text-gray-600 dark:text-gray-400 text-sm">
                                          Total Credits: {semesterData.SGPA?.totalCredits || 'N/A'}
                                        </div>
                                        <div className="text-gray-600 dark:text-gray-400 text-sm">
                                          Backlog Count: {semesterData.SGPA?.backlogcount || '0'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Results Table */}
                                  <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-xs">
                                      <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-700">
                                          <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">SNO</th>
                                          <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">SUBJECT NAME</th>
                                          <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">SUBJECT CODE</th>
                                          <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">GRADE POINTS</th>
                                          <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">GRADE</th>
                                          <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">CREDITS</th>
                                          <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">EXAM TYPE</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {semesterData.results?.map((subject: any, subjectIndex: number) => (
                                          <tr key={subjectIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{subjectIndex + 1}</td>
                                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{subject.subjectName}</td>
                                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{subject.subjectCode}</td>
                                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{subject.gradepoints}</td>
                                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center font-medium">{subject.grade}</td>
                                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{subject.credits}</td>
                                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{subject.examType}</td>
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
                      ) : (
                        <div className="text-center py-8">
                          <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">Loading semester results...</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timetable Modal */}
        {showTimetableDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Timetable</h2>
                  <button
                    onClick={() => setShowTimetableDetails(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Timetable Content */}
                <div className="space-y-4">
                  {timetableData ? (
                    timetableData.map((dayData: any, dayIndex: number) => (
                      <div key={dayIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        {/* Day Header - Collapsible */}
                        <button
                          onClick={() => {
                            const newExpandedDays = new Set(expandedDays)
                            if (expandedDays.has(dayIndex)) {
                              newExpandedDays.delete(dayIndex)
                            } else {
                              newExpandedDays.add(dayIndex)
                            }
                            setExpandedDays(newExpandedDays)
                          }}
                          className="w-full p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex justify-between items-center"
                        >
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {dayData.dayname}
                          </h3>
                          <ChevronDown 
                            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                              expandedDays.has(dayIndex) ? 'rotate-180' : ''
                            }`} 
                          />
                        </button>

                        {/* Day Content */}
                        <div className={`p-4 ${expandedDays.has(dayIndex) ? '' : 'hidden'}`}>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm">
                              <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700">
                                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">Period</th>
                                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">Subject</th>
                                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left">Faculty</th>
                                </tr>
                              </thead>
                              <tbody>
                                                                 {dayData.periods?.map((periodData: any, periodIndex: number) => {
                                   // Extract period number and subject from the period data
                                   const periodKey = Object.keys(periodData).find(key => key.startsWith('Period'))
                                   const periodNumber = periodKey?.replace('Period ', '') || (periodIndex + 1)
                                   const subject = periodKey ? periodData[periodKey] || 'No Subject' : 'No Subject'
                                   const faculty = periodData.faculty || 'No Faculty'
                                  
                                  return (
                                    <tr key={periodIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-medium">
                                        {periodNumber}
                                      </td>
                                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        {subject}
                                      </td>
                                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                        {faculty}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Loading timetable...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Netra QR Modal */}
        {showNetraQR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Netra Details</h2>
                  </div>
                  <button
                    onClick={() => setShowNetraQR(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Hall Ticket Number */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hall Ticket Number
                  </label>
                  <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg text-gray-900 dark:text-white font-mono">
                    {studentData?.hallTicket || 'Unknown'}
                  </div>
                </div>

                {/* QR Code */}
                <div className="mb-6 flex justify-center">
                  {studentData?.qrCode ? (
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                      <img 
                        src={studentData.qrCode} 
                        alt="Netra QR Code" 
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <QrCode className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 mb-4">
                  <button
                    onClick={downloadQRCode}
                    disabled={!studentData?.qrCode}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download</span>
                  </button>
                  <button
                    onClick={shareQRCode}
                    disabled={!studentData?.qrCode}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <span>Share</span>
                  </button>
                </div>

                {/* Instruction Text */}
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Scan the QR code to verify your details
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
