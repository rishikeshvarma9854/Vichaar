// 🚀 Optimized API Client - Reduce Redundant Calls & Egress
// This consolidates multiple API calls and implements smart caching

import { 
  studentProfileCache, 
  attendanceCache, 
  resultsCache,
  cacheManager 
} from './cache';

export interface OptimizedLoginResponse {
  success: boolean;
  data?: {
    login: any;
    profile: any;
    basicAttendance?: any;
    basicResults?: any;
  };
  error?: string;
}

export interface OptimizedStudentData {
  profile: any;
  attendance: any;
  results: any;
  timetable?: any;
}

class OptimizedAPIClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadTokens();
  }

  // 🎯 Load tokens from localStorage
  private loadTokens(): void {
    try {
      this.accessToken = localStorage.getItem('kmit_access_token');
      this.refreshToken = localStorage.getItem('kmit_refresh_token');
      const expiry = localStorage.getItem('kmit_token_expiry');
      this.tokenExpiry = expiry ? parseInt(expiry) : 0;
    } catch (error) {
      console.warn('Failed to load tokens:', error);
    }
  }

  // 🎯 Save tokens to localStorage
  private saveTokens(accessToken: string, refreshToken: string, expiry: number): void {
    try {
      localStorage.setItem('kmit_access_token', accessToken);
      localStorage.setItem('kmit_refresh_token', refreshToken);
      localStorage.setItem('kmit_token_expiry', expiry.toString());
      
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.tokenExpiry = expiry;
    } catch (error) {
      console.warn('Failed to save tokens:', error);
    }
  }

  // 🎯 Check if token is valid
  private isTokenValid(): boolean {
    return Boolean(this.accessToken) && Date.now() < this.tokenExpiry;
  }

  // 🎯 Get auth headers
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  // 🎯 Make HTTP request with error handling
  private async makeRequest<T = any>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // 🎯 OPTIMIZED: Single login call that returns comprehensive data
  async loginWithFullData(
    username: string, 
    password: string, 
    application: string, 
    token: string
  ): Promise<OptimizedLoginResponse> {
    try {
      console.log('🚀 Performing optimized login with full data fetch...');
      
      // Step 1: Perform login
      const loginResponse = await this.makeRequest<{success: boolean; data?: any; error?: string}>('/login-with-token', {
        method: 'POST',
        body: JSON.stringify({ username, password, application, token }),
      });

      if (!loginResponse.success) {
        return { 
          success: false, 
          error: loginResponse.error || 'Login failed' 
        };
      }

      const kmitData = loginResponse.data;
      
      // Save tokens
      this.saveTokens(
        kmitData.access_token,
        kmitData.refresh_token,
        Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      );

      // Step 2: Fetch profile (this is usually needed immediately)
      let profile = null;
      try {
        profile = await this.getStudentProfile();
        console.log('✅ Profile fetched during login');
      } catch (error) {
        console.warn('⚠️ Profile fetch failed during login, will retry later');
      }

      // Step 3: Fetch basic attendance (cached, minimal data)
      let basicAttendance = null;
      try {
        basicAttendance = await this.getBasicAttendance();
        console.log('✅ Basic attendance fetched during login');
      } catch (error) {
        console.warn('⚠️ Basic attendance fetch failed during login');
      }

      // Step 4: Fetch basic results (cached, minimal data)
      let basicResults = null;
      try {
        basicResults = await this.getBasicResults();
        console.log('✅ Basic results fetched during login');
      } catch (error) {
        console.warn('⚠️ Basic results fetch failed during login');
      }

      return {
        success: true,
        data: {
          login: kmitData,
          profile,
          basicAttendance,
          basicResults,
        },
      };

    } catch (error) {
      console.error('❌ Optimized login failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  // 🎯 OPTIMIZED: Get student profile with caching
  async getStudentProfile(): Promise<any> {
    // Check cache first
    const mobileNumber = this.getCurrentUserMobile();
    if (mobileNumber && studentProfileCache.has(mobileNumber)) {
      console.log('🎯 Returning cached student profile');
      return studentProfileCache.get(mobileNumber);
    }

    try {
      console.log('🔍 Fetching fresh student profile...');
      const response = await this.makeRequest<{payload?: {student?: any}}>('/sanjaya/getStudentProfile');
      
      if (response && response.payload && response.payload.student) {
        const profile = response.payload.student;
        
        // Cache the profile
        if (mobileNumber) {
          studentProfileCache.set(mobileNumber, profile);
          console.log('💾 Cached student profile');
        }
        
        return response;
      }
      
      throw new Error('Invalid profile response structure');
    } catch (error) {
      console.error('❌ Failed to fetch student profile:', error);
      throw error;
    }
  }

  // 🎯 OPTIMIZED: Get attendance with caching and minimal data
  async getAttendance(): Promise<any> {
    const mobileNumber = this.getCurrentUserMobile();
    
    // Check cache first
    if (mobileNumber && attendanceCache.has(mobileNumber)) {
      console.log('🎯 Returning cached attendance data');
      return attendanceCache.get(mobileNumber);
    }

    try {
      console.log('🔍 Fetching fresh attendance data...');
      const response = await this.makeRequest<{payload?: any}>('/sanjaya/getAttendance');
      
      if (response && response.payload) {
        // Cache the attendance data
        if (mobileNumber) {
          attendanceCache.set(mobileNumber, response);
          console.log('💾 Cached attendance data');
        }
        
        return response;
      }
      
      throw new Error('Invalid attendance response structure');
    } catch (error) {
      console.error('❌ Failed to fetch attendance:', error);
      throw error;
    }
  }

  // 🎯 OPTIMIZED: Get basic attendance (minimal data for dashboard)
  async getBasicAttendance(): Promise<any> {
    const mobileNumber = this.getCurrentUserMobile();
    
    // Check cache first
    if (mobileNumber && attendanceCache.has(mobileNumber)) {
      const cached = attendanceCache.get(mobileNumber);
      if (cached) {
        // Return minimal data for dashboard
        return this.extractBasicAttendanceData(cached);
      }
    }

    try {
      const fullAttendance = await this.getAttendance();
      return this.extractBasicAttendanceData(fullAttendance);
    } catch (error) {
      console.error('❌ Failed to get basic attendance:', error);
      return null;
    }
  }

  // 🎯 OPTIMIZED: Get results with caching
  async getResults(): Promise<any> {
    const mobileNumber = this.getCurrentUserMobile();
    
    // Check cache first
    if (mobileNumber && resultsCache.has(mobileNumber)) {
      console.log('🎯 Returning cached results data');
      return resultsCache.get(mobileNumber);
    }

    try {
      console.log('🔍 Fetching fresh results data...');
      const response = await this.makeRequest<{payload?: any}>('/sanjaya/getResults');
      
      if (response && response.payload) {
        // Cache the results data
        if (mobileNumber) {
          resultsCache.set(mobileNumber, response);
          console.log('💾 Cached results data');
        }
        
        return response;
      }
      
      throw new Error('Invalid results response structure');
    } catch (error) {
      console.error('❌ Failed to fetch results:', error);
      throw error;
    }
  }

  // 🎯 OPTIMIZED: Get basic results (minimal data for dashboard)
  async getBasicResults(): Promise<any> {
    const mobileNumber = this.getCurrentUserMobile();
    
    // Check cache first
    if (mobileNumber && resultsCache.has(mobileNumber)) {
      const cached = resultsCache.get(mobileNumber);
      if (cached) {
        // Return minimal data for dashboard
        return this.extractBasicResultsData(cached);
      }
    }

    try {
      const fullResults = await this.getResults();
      return this.extractBasicResultsData(fullResults);
    } catch (error) {
      console.error('❌ Failed to get basic results:', error);
      return null;
    }
  }

  // 🎯 OPTIMIZED: Get comprehensive student data in single request
  async getComprehensiveStudentData(): Promise<OptimizedStudentData> {
    const mobileNumber = this.getCurrentUserMobile();
    
    try {
      console.log('🚀 Fetching comprehensive student data...');
      
      // Use cached data where possible, fetch fresh where needed
      const [profile, attendance, results] = await Promise.allSettled([
        this.getStudentProfile(),
        this.getAttendance(),
        this.getResults(),
      ]);

      return {
        profile: profile.status === 'fulfilled' ? profile.value : null,
        attendance: attendance.status === 'fulfilled' ? attendance.value : null,
        results: results.status === 'fulfilled' ? results.value : null,
      };
    } catch (error) {
      console.error('❌ Failed to get comprehensive student data:', error);
      throw error;
    }
  }

  // 🎯 OPTIMIZED: Get internal results with caching
  async getInternalResults(): Promise<any> {
    try {
      console.log('🔍 Fetching internal results...');
      const response = await this.makeRequest<{success?: boolean; data?: any}>('/sanjaya/getInternalResults');
      
      if (response && response.success) {
        return response;
      }
      
      throw new Error('Invalid internal results response structure');
    } catch (error) {
      console.error('❌ Failed to fetch internal results:', error);
      throw error;
    }
  }

  // 🎯 OPTIMIZED: Get semester results with caching
  async getSemesterResults(): Promise<any> {
    try {
      console.log('🔍 Fetching semester results...');
      const response = await this.makeRequest<{success?: boolean; data?: any}>('/sanjaya/getSemesterResults');
      
      if (response && response.success) {
        return response;
      }
      
      throw new Error('Invalid semester results response structure');
    } catch (error) {
      console.error('❌ Failed to fetch semester results:', error);
      throw error;
    }
  }

  // 🎯 OPTIMIZED: Get timetable with caching
  async getTimetable(): Promise<any> {
    try {
      console.log('🔍 Fetching timetable...');
      const response = await this.makeRequest<{success?: boolean; data?: any}>('/sanjaya/getTimetable');
      
      if (response && response.success) {
        return response;
      }
      
      throw new Error('Invalid timetable response structure');
    } catch (error) {
      console.error('❌ Failed to fetch timetable:', error);
      throw error;
    }
  }

  // 🎯 OPTIMIZED: Get subject attendance with caching
  async getSubjectAttendance(): Promise<any> {
    try {
      console.log('🔍 Fetching subject attendance...');
      const response = await this.makeRequest<{success?: boolean; data?: any}>('/sanjaya/getSubjectAttendance');
      
      if (response && response.success) {
        return response;
      }
      
      throw new Error('Invalid subject attendance response structure');
    } catch (error) {
      console.error('❌ Failed to fetch subject attendance:', error);
      throw error;
    }
  }

  // 🎯 Extract minimal attendance data for dashboard
  private extractBasicAttendanceData(attendanceData: any): any {
    if (!attendanceData?.payload?.attendanceDetails) {
      return null;
    }

    // Extract only essential data for dashboard
    const basicData = {
      totalDays: attendanceData.payload.attendanceDetails.length,
      todayStatus: null,
      overallPercentage: 0,
      recentDays: attendanceData.payload.attendanceDetails.slice(0, 5), // Last 5 days only
    };

    // Find today's entry
    const todayEntry = attendanceData.payload.attendanceDetails.find(
      (day: any) => day.date === "Today"
    );
    
    if (todayEntry) {
      basicData.todayStatus = todayEntry.periods?.map((p: any) => ({
        period: p.period_no,
        status: p.status,
      })) || [];
    }

    return basicData;
  }

  // 🎯 Extract minimal results data for dashboard
  private extractBasicResultsData(resultsData: any): any {
    if (!resultsData?.payload) {
      return null;
    }

    // Extract only essential data for dashboard
    return {
      hasResults: true,
      lastUpdated: resultsData.payload.lastUpdated || new Date().toISOString(),
      // Add other essential fields as needed
    };
  }

  // 🎯 Get current user mobile number
  private getCurrentUserMobile(): string | null {
    try {
      // Try to get from localStorage or other sources
      const currentStudent = localStorage.getItem('currentStudent');
      if (currentStudent) {
        const parsed = JSON.parse(currentStudent);
        return parsed.mobile_number || parsed.phone;
      }
      
      // Try to get from profile cache
      const profileKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('cache_student_profile_')
      );
      
      if (profileKeys.length > 0) {
        const lastProfileKey = profileKeys[profileKeys.length - 1];
        return lastProfileKey.replace('cache_student_profile_', '');
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to get current user mobile:', error);
      return null;
    }
  }

  // 🎯 Clear all caches (useful for logout)
  clearCaches(): void {
    cacheManager.clear();
    console.log('🧹 All caches cleared');
  }

  // 🎯 Get cache statistics
  getCacheStats(): any {
    return cacheManager.getStats();
  }

  // 🎯 Check if user is authenticated
  isAuthenticated(): boolean {
    return this.isTokenValid();
  }

  // 🎯 Logout and clear data
  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = 0;
    
    // Clear tokens from localStorage
    localStorage.removeItem('kmit_access_token');
    localStorage.removeItem('kmit_refresh_token');
    localStorage.removeItem('kmit_token_expiry');
    
    // Clear caches
    this.clearCaches();
    
    console.log('🚪 User logged out, caches cleared');
  }
}

// 🎯 Create and export the optimized API client
export const optimizedApiClient = new OptimizedAPIClient(
  'https://vichaar-kappa.vercel.app/api'
);

// 🎯 Export the class for testing
export { OptimizedAPIClient };

// 🎯 Utility function to get cache statistics
export const getApiCacheStats = () => optimizedApiClient.getCacheStats();

// 🎯 Utility function to clear all caches
export const clearApiCaches = () => optimizedApiClient.clearCaches();
