import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your-supabase-url'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database table types
export interface StudentCredentials {
  id: number
  mobile_number: string
  password: string
  created_at: string
  updated_at: string
}

export interface StudentProfile {
  id: number
  mobile_number: string
  hall_ticket: string
  name: string
  branch: string
  year: string
  semester: string
  student_image?: string
  qr_code?: string
  profile_data: any // Full profile data from KMIT API
  created_at: string
  updated_at: string
}

// Database operations
export const supabaseDB = {
  // Check if credentials already exist
  async checkCredentialsExist(mobileNumber: string): Promise<{ data: any; error: any }> {
    return await supabase
      .from('student_credentials')
      .select('mobile_number')
      .eq('mobile_number', mobileNumber)
      .single()
  },

  // Insert student credentials (with duplicate handling)
  async insertCredentials(mobileNumber: string, password: string): Promise<{ data: any; error: any }> {
    // First check if credentials already exist
    const { data: existingCreds, error: checkError } = await this.checkCredentialsExist(mobileNumber)
    
    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is expected for new users
      console.error('Error checking existing credentials:', checkError)
      return { data: null, error: checkError }
    }
    
    if (existingCreds) {
      // Credentials already exist, return success without inserting
      console.log('Credentials already exist for mobile number:', mobileNumber)
      return { data: existingCreds, error: null }
    }
    
    // No existing credentials, insert new ones
    return await supabase
      .from('student_credentials')
      .insert([
        { 
          mobile_number: mobileNumber, 
          password: password 
        }
      ])
      .select()
  },

  // Insert student profile (with duplicate handling)
  async insertProfile(profileData: Omit<StudentProfile, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: any; error: any }> {
    // First check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('mobile_number', profileData.mobile_number)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is expected for new users
      console.error('Error checking existing profile:', checkError)
      return { data: null, error: checkError }
    }
    
    if (existingProfile) {
      // Profile already exists, update it instead of inserting
      console.log('Profile already exists for mobile number:', profileData.mobile_number, '- updating instead')
      return await supabase
        .from('student_profiles')
        .update(profileData)
        .eq('mobile_number', profileData.mobile_number)
        .select()
    }
    
    // No existing profile, insert new one
    return await supabase
      .from('student_profiles')
      .insert([profileData])
      .select()
  },

  // Update existing profile with new data
  async updateProfileData(mobileNumber: string, newProfileData: Partial<StudentProfile>): Promise<{ data: any; error: any }> {
    return await supabase
      .from('student_profiles')
      .update(newProfileData)
      .eq('mobile_number', mobileNumber)
      .select()
  },

  // Search student by hall ticket, name, or mobile number (optimized)
  async searchStudent(searchTerm: string): Promise<{ data: any; error: any }> {
    const searchQuery = searchTerm.trim().toUpperCase()
    
    // Use a single optimized query with proper ordering
    return await supabase
      .from('student_profiles')
      .select('*')
      .or(`hall_ticket.ilike.${searchQuery},name.ilike.${searchQuery},mobile_number.ilike.${searchQuery}`)
      .limit(5) // Limit results for faster response
  },

  // Fast search by exact hall ticket (most common case)
  async searchByHallTicket(hallTicket: string): Promise<{ data: any; error: any }> {
    return await supabase
      .from('student_profiles')
      .select('*')
      .eq('hall_ticket', hallTicket.toUpperCase())
      .limit(1)
  },

  // Fast search by exact name
  async searchByName(name: string): Promise<{ data: any; error: any }> {
    return await supabase
      .from('student_profiles')
      .select('*')
      .ilike('name', `%${name.toUpperCase()}%`)
      .limit(3)
  },

  // Fast search by partial hall ticket (for partial matches)
  async searchByPartialHallTicket(partialHallTicket: string): Promise<{ data: any; error: any }> {
    return await supabase
      .from('student_profiles')
      .select('*')
      .ilike('hall_ticket', `%${partialHallTicket.toUpperCase()}%`)
      .limit(5)
  },

  // Get credentials by mobile number
  async getCredentials(mobileNumber: string): Promise<{ data: any; error: any }> {
    return await supabase
      .from('student_credentials')
      .select('*')
      .eq('mobile_number', mobileNumber)
      .single()
  },

  // Get profile by mobile number
  async getProfile(mobileNumber: string): Promise<{ data: any; error: any }> {
    return await supabase
      .from('student_profiles')
      .select('*')
      .eq('mobile_number', mobileNumber)
      .single()
  },

  // Find profile by any identifier (mobile, hall ticket, or name)
  async findProfileByIdentifier(identifier: string): Promise<{ data: any; error: any }> {
    const searchQuery = identifier.trim().toUpperCase()
    
    return await supabase
      .from('student_profiles')
      .select('*')
      .or(`mobile_number.ilike.%${searchQuery}%,hall_ticket.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)
      .limit(1)
  },

  // Create mapping between login credentials and student profile
  async createLoginMapping(loginPhoneNumber: string, studentMobileNumber: string): Promise<{ data: any; error: any }> {
    return await supabase
      .from('login_mappings')
      .upsert([
        {
          login_phone_number: loginPhoneNumber,
          student_mobile_number: studentMobileNumber,
          created_at: new Date().toISOString()
        }
      ], {
        onConflict: 'login_phone_number',
        ignoreDuplicates: false
      })
      .select()
  },

  // Get student profile by login phone number
  async getProfileByLoginPhone(loginPhoneNumber: string): Promise<{ data: any; error: any }> {
    // First get the mapping
    const { data: mapping, error: mappingError } = await supabase
      .from('login_mappings')
      .select('student_mobile_number')
      .eq('login_phone_number', loginPhoneNumber)
      .single()
    
    if (mappingError || !mapping) {
      // If no mapping exists, try to get profile directly (for backward compatibility)
      return await this.getProfile(loginPhoneNumber)
    }
    
    // Then get the profile using the student's mobile number
    return await this.getProfile(mapping.student_mobile_number)
  },

  // Get student profile by login phone number (with fallback)
  async getStudentProfileForLogin(loginPhoneNumber: string): Promise<{ data: any; error: any }> {
    // Try to get profile by login phone number first
    const { data: profile, error: profileError } = await this.getProfileByLoginPhone(loginPhoneNumber)
    
    if (profile && !profileError) {
      return { data: profile, error: null }
    }
    
    // If that fails, try to get profile directly (for backward compatibility)
    return await this.getProfile(loginPhoneNumber)
  },

  // Update profile data
  async updateProfile(mobileNumber: string, profileData: Partial<StudentProfile>): Promise<{ data: any; error: any }> {
    return await supabase
      .from('student_profiles')
      .update(profileData)
      .eq('mobile_number', mobileNumber)
      .select()
  }
}

export default supabase
