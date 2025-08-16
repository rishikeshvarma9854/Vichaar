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
  // Insert student credentials
  async insertCredentials(mobileNumber: string, password: string): Promise<{ data: any; error: any }> {
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

  // Insert student profile
  async insertProfile(profileData: Omit<StudentProfile, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: any; error: any }> {
    return await supabase
      .from('student_profiles')
      .insert([profileData])
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
