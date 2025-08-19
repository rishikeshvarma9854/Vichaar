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
    const { data, error: checkError } = await supabase
      .from('student_credentials')
      .select('mobile_number')
      .eq('mobile_number', mobileNumber)
    
    // Check if we got any results
    if (data && data.length > 0) {
      return { data: data[0], error: null }
    } else {
      return { data: null, error: { code: 'PGRST116', message: 'No rows returned' } }
    }
  },

  // Insert student credentials (with duplicate handling)
  async insertCredentials(mobileNumber: string, password: string): Promise<{ data: any; error: any }> {
    console.log('🔐 insertCredentials called with:', { mobileNumber, password: password ? '***' : 'null' })
    
    // First check if credentials already exist
    const { data: existingCreds, error: checkError } = await this.checkCredentialsExist(mobileNumber)
    
    console.log('🔐 Credentials existence check result:', { existingCreds, checkError })
    
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
    console.log('🔐 No existing credentials found, inserting new credentials for mobile number:', mobileNumber)
    
    const insertResult = await supabase
      .from('student_credentials')
      .insert([
        { 
          mobile_number: mobileNumber, 
          password: password 
        }
      ])
      .select()
    
    console.log('🔐 Insert credentials result:', insertResult)
    return insertResult
  },

  // Insert student profile (with duplicate handling)
  async insertProfile(profileData: Omit<StudentProfile, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: any; error: any }> {
    console.log('🔍 insertProfile called with:', profileData)
    
    try {
      // First check if profile already exists
      const { data: existingProfiles, error: checkError } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('mobile_number', profileData.mobile_number)
      
      console.log('🔍 Profile existence check result:', { existingProfiles, checkError })
      
      if (checkError) {
        console.error('❌ Error checking existing profile:', checkError)
        return { data: null, error: checkError }
      }
      
      if (existingProfiles && existingProfiles.length > 0) {
        // Profile already exists, update it instead of inserting
        console.log('✅ Profile already exists for mobile number:', profileData.mobile_number, '- updating instead')
        console.log('🔍 Updating existing profile with data:', profileData)
        
        const updateResult = await supabase
          .from('student_profiles')
          .update(profileData)
          .eq('mobile_number', profileData.mobile_number)
          .select()
        
        console.log('🔍 Update result:', updateResult)
        return updateResult
      }
      
      // No existing profile, insert new one
      console.log('🔍 No existing profile found, inserting new profile with data:', profileData)
      
      // Verify the data structure before insert
      console.log('🔍 Profile data to insert:', JSON.stringify(profileData, null, 2))
      
      const insertResult = await supabase
        .from('student_profiles')
        .insert([profileData])
        .select()
      
      console.log('🔍 Insert result:', insertResult)
      
      if (insertResult.error) {
        console.error('❌ Insert failed with error:', insertResult.error)
        console.error('❌ Error details:', {
          code: insertResult.error.code,
          message: insertResult.error.message,
          details: insertResult.error.details,
          hint: insertResult.error.hint
        })
      } else {
        console.log('✅ Insert successful:', insertResult.data)
      }
      
      return insertResult
      
    } catch (error) {
      console.error('❌ Exception in insertProfile:', error)
      return { data: null, error: { message: `Exception: ${error}` } }
    }
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
    
    // Use a single optimized query with proper ordering and better matching
    return await supabase
      .from('student_profiles')
      .select('*')
      .or(`hall_ticket.ilike.${searchQuery},name.ilike.${searchQuery},mobile_number.ilike.${searchQuery}`)
      .order('name', { ascending: true }) // Order by name for better results
      // Removed limit to show all results
  },

  // Fast search by exact hall ticket (most common case)
  async searchByHallTicket(hallTicket: string): Promise<{ data: any; error: any }> {
    const cleanHallTicket = hallTicket.trim().toUpperCase()
    return await supabase
      .from('student_profiles')
      .select('*')
      .eq('hall_ticket', cleanHallTicket)
      // Removed limit to show all results
  },

  // Fast search by exact name - improved for better accuracy
  async searchByName(name: string): Promise<{ data: any; error: any }> {
    const cleanName = name.trim().toUpperCase()
    
    // Try multiple name search strategies for better accuracy
    let results = await supabase
      .from('student_profiles')
      .select('*')
      .ilike('name', `%${cleanName}%`)
      .order('name', { ascending: true })
      // Removed limit to show all results
    
    // If no results with partial match, try word boundary search
    if (!results.data || results.data.length === 0) {
      // Split name into words and search for each word
      const nameWords = cleanName.split(/\s+/).filter(word => word.length >= 2)
      
      if (nameWords.length > 1) {
        // Search for students whose names contain ALL the words (in any order)
        let wordQueries = nameWords.map(word => `name.ilike.%${word}%`)
        results = await supabase
          .from('student_profiles')
          .select('*')
          .or(wordQueries.join(','))
          .order('name', { ascending: true })
          // Removed limit to show all results
      }
    }
    
    return results
  },

  // Fast search by partial hall ticket (for partial matches)
  async searchByPartialHallTicket(partialHallTicket: string): Promise<{ data: any; error: any }> {
    const cleanPartial = partialHallTicket.trim().toUpperCase()
    return await supabase
      .from('student_profiles')
      .select('*')
      .ilike('hall_ticket', `%${cleanPartial}%`)
      .order('hall_ticket', { ascending: true })
      // Removed limit to show all results
  },

  // Get credentials by mobile number
  async getCredentials(mobileNumber: string): Promise<{ data: any; error: any }> {
    const { data, error } = await supabase
      .from('student_credentials')
      .select('*')
      .eq('mobile_number', mobileNumber)
    
    if (data && data.length > 0) {
      return { data: data[0], error: null }
    } else {
      return { data: null, error: { code: 'PGRST116', message: 'No rows returned' } }
    }
  },

  // Get profile by mobile number
  async getProfile(mobileNumber: string): Promise<{ data: any; error: any }> {
    const { data, error: profileError } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('mobile_number', mobileNumber)
    
    if (data && data.length > 0) {
      return { data: data[0], error: null }
    } else {
      return { data: null, error: { code: 'PGRST116', message: 'No rows returned' } }
    }
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
    const { data: mappings, error: mappingError } = await supabase
      .from('login_mappings')
      .select('student_mobile_number')
      .eq('login_phone_number', loginPhoneNumber)
    
    if (mappingError) {
      return { data: null, error: mappingError }
    }
    
    if (mappings && mappings.length > 0) {
      // Then get the profile using the student's mobile number
      return await this.getProfile(mappings[0].student_mobile_number)
    } else {
      // If no mapping exists, try to get profile directly (for backward compatibility)
      return await this.getProfile(loginPhoneNumber)
    }
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
