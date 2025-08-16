import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import apiClient from '@/lib/api'

interface User {
  username: string
  name: string
  role: string
  collegeId: number
  collegeName: string
  sub: number
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in by checking KMIT API authentication state
    const checkAuth = async () => {
      try {
        // Use apiClient.isAuthenticated() to check KMIT API auth state
        const isKMITAuthenticated = apiClient.isAuthenticated()
        console.log('🔐 AuthContext: KMIT API authentication state:', isKMITAuthenticated)
        
        if (isKMITAuthenticated) {
          // If authenticated, try to get user profile
          try {
            const profile = await apiClient.getStudentProfile()
            if (profile && profile.payload && profile.payload.student) {
              const studentData = profile.payload.student
              setUser({
                username: studentData.htno || '',
                name: studentData.name || '',
                role: 'STUDENT',
                collegeId: 1,
                collegeName: 'KMIT',
                sub: parseInt(localStorage.getItem('kmit_student_id') || '0')
              })
              console.log('🔐 AuthContext: User profile loaded successfully')
            }
          } catch (profileError) {
            console.log('🔐 AuthContext: Could not load profile, but user is authenticated')
            // User is authenticated but profile loading failed - this is okay
            // Set a minimal user object to maintain authentication state
            setUser({
              username: localStorage.getItem('kmit_student_id') || '',
              name: 'Student',
              role: 'STUDENT',
              collegeId: 1,
              collegeName: 'KMIT',
              sub: parseInt(localStorage.getItem('kmit_student_id') || '0')
            })
          }
        } else {
          console.log('🔐 AuthContext: User not authenticated')
          setUser(null)
        }
      } catch (error) {
        console.log('🔐 AuthContext: Error checking authentication:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      const result = await apiClient.login(username, password)
      
      if (result.success) {
        // After successful login, try to get user profile
        try {
          const profile = await apiClient.getStudentProfile()
          if (profile && profile.payload && profile.payload.student) {
            const studentData = profile.payload.student
            setUser({
              username: studentData.htno || username,
              name: studentData.name || '',
              role: 'STUDENT',
              collegeId: 1,
              collegeName: 'KMIT',
              sub: parseInt(localStorage.getItem('kmit_student_id') || '0')
            })
            return true
          }
        } catch (profileError) {
          console.log('🔐 AuthContext: Could not load profile after login, but login was successful')
          // Login succeeded but profile loading failed - set minimal user object
          setUser({
            username: username,
            name: 'Student',
            role: 'STUDENT',
            collegeId: 1,
            collegeName: 'KMIT',
            sub: parseInt(localStorage.getItem('kmit_student_id') || '0')
          })
          return true
        }
      }
      return false
    } catch (error) {
      console.error('🔐 AuthContext: Login error:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    apiClient.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
