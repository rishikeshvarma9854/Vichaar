import axios from 'axios'

// Backend URL configuration
// For local development: http://localhost:5000/api
// For ngrok: Change this to your ngrok backend URL
// Example: const BACKEND_BASE_URL = 'https://your-ngrok-url.ngrok.io/api'
const BACKEND_BASE_URL = 'https://vichaar-backend.onrender.com'

console.log('🌐 Backend URL:', BACKEND_BASE_URL)
console.log('📍 Current location:', window.location.href)

// Create axios instance for our backend
const backendClient = axios.create({
  baseURL: BACKEND_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface KMITLoginResponse {
  Error: boolean
  access_token: string
  refresh_token: string
  username: string
  sub: number
  role: string
  collegeId: number
  collegeName: string
  name: string
}

export interface StudentData {
  name: string
  hallTicket: string
  branch: string
  year: string
  semester: string
  studentImage?: string
  qrCode?: string
  attendance: {
    overall: number
    present: number
    absent: number
    noSessions: number
    sessions: any[]
  }
  results: {
    cgpa: number
  }
}

export interface AttendanceData {
  success: boolean
  data: {
    Error: boolean
    payload: {
      attendanceDetails: Array<{
        date: string
        status: string
        subjects?: Array<{
          name: string
          status: string | number
          [key: string]: any
        }>
        [key: string]: any
      }>
      overallAttendance: string
      [key: string]: any
    }
  }
  message?: string
  attendance?: any // For backward compatibility
}

class KMITVichaarAPI {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private tokenExpiry: number = 0
  private studentId: number | null = null

  // Decode JWT token to extract student ID
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('Failed to decode JWT:', error)
      return null
    }
  }

  // Save tokens to localStorage
  private saveTokens(accessToken: string, refreshToken: string, studentId?: number) {
    // If studentId is not provided, try to extract it from the JWT
    if (!studentId || studentId === 0) {
      const decoded = this.decodeJWT(accessToken)
      if (decoded && decoded.sub) {
        studentId = decoded.sub
        console.log('Extracted studentId from JWT:', studentId)
      }
    }
    
    // Set token expiry to 8 hours from now (KMIT tokens expire every 8 hours)
    const tokenExpiry = Date.now() + (8 * 60 * 60 * 1000)
    
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    this.studentId = studentId || 0
    this.tokenExpiry = tokenExpiry
    
    // Save to localStorage
    localStorage.setItem('kmit_access_token', accessToken)
    localStorage.setItem('kmit_refresh_token', refreshToken)
    localStorage.setItem('kmit_student_id', String(studentId || 0))
    localStorage.setItem('kmit_token_expiry', String(tokenExpiry))
    
    console.log('Tokens saved successfully:', {
      accessToken: accessToken ? 'present' : 'missing',
      refreshToken: refreshToken ? 'present' : 'missing',
      studentId,
      tokenExpiry: new Date(tokenExpiry).toISOString()
    })
  }

  // Load tokens from localStorage
  private loadTokens(): boolean {
    try {
      const accessToken = localStorage.getItem('kmit_access_token')
      const refreshToken = localStorage.getItem('kmit_refresh_token')
      const studentIdStr = localStorage.getItem('kmit_student_id')
      const tokenExpiryStr = localStorage.getItem('kmit_token_expiry')
      
      if (!accessToken || !refreshToken || !studentIdStr || !tokenExpiryStr) {
        console.log('Missing tokens in localStorage')
        return false
      }
      
      const studentId = parseInt(studentIdStr, 10)
      const tokenExpiry = parseInt(tokenExpiryStr, 10)
      
      // Check if token is expired
      if (Date.now() >= tokenExpiry) {
        console.log('Token expired, clearing tokens')
        this.clearTokens()
        return false
      }
      
      this.accessToken = accessToken
      this.refreshToken = refreshToken
      this.studentId = studentId
      this.tokenExpiry = tokenExpiry
      
      // Update axios headers
      backendClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      
      console.log('Tokens loaded successfully:', {
        accessToken: accessToken ? 'present' : 'missing',
        refreshToken: refreshToken ? 'present' : 'missing',
        studentId,
        tokenExpiry: new Date(tokenExpiry).toISOString()
      })
      
      return true
    } catch (error) {
      console.error('Failed to load tokens:', error)
      this.clearTokens()
      return false
    }
  }

  // Clear tokens
  private clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    this.studentId = null
    this.tokenExpiry = 0
    
    localStorage.removeItem('kmit_access_token')
    localStorage.removeItem('kmit_refresh_token')
    localStorage.removeItem('kmit_student_id')
    localStorage.removeItem('kmit_token_expiry')
    
    delete backendClient.defaults.headers.common['Authorization']
  }

  // Store student data in localStorage for search functionality
  private storeStudentForSearch(studentData: any) {
    try {
      console.log('📝 Storing student data:', studentData)
      
      const registeredStudents = JSON.parse(localStorage.getItem('registeredStudents') || '[]')
      console.log('📝 Current registered students:', registeredStudents)
      
      // Check if student already exists
      const existingIndex = registeredStudents.findIndex((s: any) => s.hallTicket === studentData.hallTicket)
      console.log('📝 Existing student index:', existingIndex)
      
      if (existingIndex >= 0) {
        // Update existing student data
        registeredStudents[existingIndex] = {
          ...registeredStudents[existingIndex],
          ...studentData,
          lastUpdated: new Date().toISOString()
        }
        console.log('📝 Updated existing student')
      } else {
        // Add new student
        registeredStudents.push({
          ...studentData,
          lastUpdated: new Date().toISOString()
        })
        console.log('📝 Added new student')
      }
      
      localStorage.setItem('registeredStudents', JSON.stringify(registeredStudents))
      console.log('✅ Student data stored for search functionality')
      console.log('📝 Final registered students:', registeredStudents)
    } catch (error) {
      console.error('❌ Error storing student for search:', error)
    }
  }

  // Set tokens manually (for search functionality)
  setTokens(accessToken: string, refreshToken: string | null, expiry: number) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    this.tokenExpiry = expiry
    
    // Update backend client headers
    if (accessToken) {
      backendClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    } else {
      delete backendClient.defaults.headers.common['Authorization']
    }
  }

  // Login to KMIT API through our backend (with hCaptcha token)
  async loginWithToken(payload: {
    username: string
    password: string
    application: string
    token: string
  }): Promise<KMITLoginResponse> {
    try {
      console.log('Attempting login with hCaptcha token...')
      
      const response = await backendClient.post('/login-with-token', payload)

      console.log('Backend response:', response.data)

      if (response.data.success) {
        const kmitData = response.data.data
        
        console.log('Full KMIT API response:', JSON.stringify(kmitData, null, 2))
        console.log('Response keys:', Object.keys(kmitData))
        console.log('Access token:', kmitData.access_token)
        console.log('Refresh token:', kmitData.refresh_token)
        console.log('Student ID (sub):', kmitData.sub)
        console.log('Student ID (studentId):', kmitData.studentId)
        console.log('Error field:', kmitData.Error)
        console.log('Name field:', kmitData.name)
        console.log('Username field:', kmitData.username)
        console.log('All available fields:', Object.keys(kmitData))
        
        // Check if the response contains the expected data structure
        if (kmitData && (kmitData.access_token || kmitData.Error === false)) {
          // Success case - save tokens and return data
          if (kmitData.access_token) {
            // Safely extract values with fallbacks
            const accessToken = kmitData.access_token
            const refreshToken = kmitData.refresh_token || 'no-refresh-token'
            
            console.log('Saving tokens:', { accessToken, refreshToken })
            
            try {
              console.log('🔐 Saving tokens...')
              this.saveTokens(accessToken, refreshToken)
              console.log('✅ Tokens saved successfully')
              
              // Fetch student profile to get complete data
              console.log('🔄 Fetching student profile...')
              const profileResponse = await this.getStudentProfile()
              console.log('📥 Profile response received:', profileResponse)
              
              if (profileResponse && profileResponse.student) {
                const studentProfile = profileResponse.student
                console.log('📋 Student profile fetched:', studentProfile)
                console.log('📋 Student name:', studentProfile.name)
                console.log('📋 Student hall ticket (htno):', studentProfile.htno)
                console.log('📋 Student branch:', studentProfile.branch?.name)
                
                // Store complete student data with all details
                const studentData = {
                  name: studentProfile.name || kmitData.name || 'Unknown Student',
                  hallTicket: studentProfile.htno || kmitData.username || payload.username.toUpperCase(),
                  branch: studentProfile.branch?.name || 'Computer Science',
                  year: `${studentProfile.currentyear || 3}rd Year`,
                  semester: `${studentProfile.currentsemester || 1}st Semester`,
                  studentImage: studentProfile.studentimage || null
                }
                console.log('📝 About to store student data:', studentData)
                this.storeStudentForSearch(studentData)
                console.log('✅ Complete student data stored')
              } else {
                console.warn('⚠️ No student profile data found')
                console.warn('⚠️ Profile response:', profileResponse)
              }
              
            } catch (error) {
              console.error('❌ Error in profile fetch or storage:', error)
              console.warn('Failed to save tokens or fetch profile:', error)
              // Continue anyway - tokens might still be valid
            }
          }
          return kmitData
        } else if (kmitData && kmitData.Error === true) {
          // KMIT API returned an error
          throw new Error(kmitData.message || 'Login failed - invalid credentials')
        } else {
          // Unexpected response structure
          console.warn('Unexpected KMIT API response structure:', kmitData)
          return kmitData // Return anyway, let the frontend handle it
        }
      } else {
        throw new Error(response.data.error || 'Login failed')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      
      if (error.response?.status === 408) {
        throw new Error('Login timeout - KMIT API is taking too long to respond')
      } else if (error.response?.status === 500) {
        throw new Error('Backend server error - please try again')
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      } else {
        throw new Error(error.message || 'Login failed - please check your connection')
      }
    }
  }

  // Login to KMIT API through our backend (legacy method)
  async login(phoneNumber: string, password: string): Promise<KMITLoginResponse> {
    try {
      console.log('Attempting login through backend...')
      
      const response = await backendClient.post('/login', {
        phoneNumber: phoneNumber,
        password: password
      })

      console.log('Backend response:', response.data)

      if (response.data.success) {
        const kmitData = response.data.data
        
        // Check if the response contains the expected data structure
        if (kmitData && (kmitData.access_token || kmitData.Error === false)) {
          // Success case - save tokens and return data
          if (kmitData.access_token) {
            this.saveTokens(kmitData.access_token, kmitData.refresh_token, kmitData.sub)
          }
          return kmitData
        } else if (kmitData && kmitData.Error === true) {
          // KMIT API returned an error
          throw new Error(kmitData.message || 'Login failed - invalid credentials')
        } else {
          // Unexpected response structure
          console.warn('Unexpected KMIT API response structure:', kmitData)
          return kmitData // Return anyway, let the frontend handle it
        }
      } else {
        throw new Error(response.data.error || 'Login failed')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      
      if (error.response?.status === 408) {
        throw new Error('Login timeout - KMIT API is taking too long to respond')
      } else if (error.response?.status === 500) {
        throw new Error('Backend server error - please try again')
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      } else {
        throw new Error(error.message || 'Login failed - please check your connection')
      }
    }
  }

  // Search for student by hall ticket or name
  async searchStudent(_query: string): Promise<StudentData> {
    // For now, we'll use a mock approach since we don't have the exact student lookup endpoint
    // In production, you'd implement the student search logic here
    
    // Simulate finding student data
    const mockStudent: StudentData = {
      name: "John Doe",
      hallTicket: "23BD1A1234",
      branch: "Computer Science & Engineering",
      year: "3rd Year",
      semester: "1st Semester",
      studentImage: undefined,
      attendance: {
        overall: 85.5,
        present: 15,
        absent: 2,
        noSessions: 1,
        sessions: [
          {"date": "2025-01-15", "status": "present", "subject": "Operating Systems"},
          {"date": "2025-01-14", "status": "present", "subject": "Data Structures"},
          {"date": "2025-01-13", "status": "present", "subject": "Computer Networks"},
          {"date": "2025-01-12", "status": "absent", "subject": "Database Systems"}
        ]
      },
      results: {
        cgpa: 8.65
      }
    }
    
    return mockStudent
  }

  // Get student profile from KMIT API through our backend
  async getStudentProfile(): Promise<any> {
    // Ensure tokens are loaded from localStorage
    if (!this.accessToken) {
      this.loadTokens()
    }
    
    if (!this.accessToken || !this.studentId || Date.now() >= this.tokenExpiry) {
      throw new Error('Authentication required. Please login first.')
    }

    try {
      // Ensure the authorization header is set on the backendClient
      backendClient.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`
      
      const response = await backendClient.get(`/student-profile/${this.studentId}`)
      
      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.error || 'Failed to fetch student profile')
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.clearTokens()
        throw new Error('Authentication expired. Please login again.')
      }
      throw new Error('Failed to fetch student profile')
    }
  }

  // Get attendance data from KMIT API through our backend
  async getAttendance(): Promise<AttendanceData> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      throw new Error('Authentication required. Please login first.')
    }

    try {
      const response = await backendClient.get('/attendance')
      
      if (response.data.success) {
        return response.data
      } else {
        throw new Error(response.data.error || 'Failed to fetch attendance data')
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.clearTokens()
        throw new Error('Authentication expired. Please login again.')
      }
      throw new Error('Failed to fetch attendance data')
    }
  }

  // Get subject attendance data
  async getSubjectAttendance(): Promise<any> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      throw new Error('Authentication required. Please login first.')
    }

    try {
      const response = await backendClient.get('/subject-attendance')
      
      if (response.data.success) {
        return response.data
      } else {
        throw new Error(response.data.error || 'Failed to fetch subject attendance')
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.clearTokens()
        throw new Error('Authentication expired. Please login again.')
      }
      throw new Error('Failed to fetch subject attendance')
    }
  }

  // Get internal assessment results
  async getInternalResults(): Promise<any> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      throw new Error('Authentication required. Please login first.')
    }

    try {
      const response = await backendClient.get('/internal-results')
      
      if (response.data.success) {
        return response.data
      } else {
        throw new Error(response.data.error || 'Failed to fetch internal results')
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.clearTokens()
        throw new Error('Authentication expired. Please login again.')
      }
      throw new Error('Failed to fetch internal results')
    }
  }

  // Get semester results
  async getSemesterResults(): Promise<any> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      throw new Error('Authentication required. Please login first.')
    }

    try {
      const response = await backendClient.get('/semester-results')
      
      if (response.data.success) {
        return response.data
      } else {
        throw new Error(response.data.error || 'Failed to fetch semester results')
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.clearTokens()
        throw new Error('Authentication expired. Please login again.')
      }
      throw new Error('Failed to fetch semester results')
    }
  }

  // Get timetable
  async getTimetable(): Promise<any> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      throw new Error('Authentication required. Please login first.')
    }

    try {
      const response = await backendClient.get('/timetable')
      
      if (response.data.success) {
        return response.data
      } else {
        throw new Error(response.data.error || 'Failed to fetch timetable')
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.clearTokens()
        throw new Error('Authentication expired. Please login again.')
      }
      throw new Error('Failed to fetch timetable')
    }
  }

  // Get notices count from KMIT API through our backend
  async getNoticesCount(): Promise<any> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      throw new Error('Authentication required. Please login first.')
    }

    try {
      // Ensure the authorization header is set on the backendClient
      backendClient.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`
      
      const response = await backendClient.get('/notices-count')
      
      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.error || 'Failed to fetch notices count')
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.clearTokens()
        throw new Error('Authentication expired. Please login again.')
      }
      throw new Error('Failed to fetch notices count')
    }
  }

  // Logout
  logout() {
    this.clearTokens()
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    // If we don't have tokens in memory, try to load them
    if (!this.accessToken) {
      return this.loadTokens()
    }
    
    // Check if current token is expired
    if (Date.now() >= this.tokenExpiry) {
      this.clearTokens()
      return false
    }
    
    return true
  }

  // Get current token for debugging
  getCurrentToken(): string | null {
    return this.accessToken
  }

  // Get current student ID for debugging
  getCurrentStudentId(): number | null {
    return this.studentId
  }
}

const apiClient = new KMITVichaarAPI()
export default apiClient
