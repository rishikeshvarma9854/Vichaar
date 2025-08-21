// 🚀 Optimized API Client - Reduce Redundant Calls & Egress
// This consolidates multiple API calls and implements smart caching

import { 
  cacheManager, 
  studentProfileCache, 
  attendanceCache, 
  resultsCache,
  timetableCache
} from './cache';

// 🎯 Keep EXACT same API structure, just add caching
class OptimizedAPIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // 🎯 Make request with caching
  private async makeRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // 🎯 LOGIN - Keep exact same as your backend
  async loginWithFullData(mobileNumber: string, password: string, hcaptchaToken: string): Promise<any> {
    try {
      const response = await this.makeRequest('/login-with-token', {
        method: 'POST',
        body: JSON.stringify({
          mobile_number: mobileNumber,
          password: password,
          hcaptcha_token: hcaptchaToken,
          application: 'netra'
        })
      });

      if (response.success && response.data?.login) {
        // Store tokens
        localStorage.setItem('kmit_access_token', response.data.login.access_token);
        localStorage.setItem('kmit_refresh_token', response.data.login.refresh_token);
        localStorage.setItem('kmit_student_id', response.data.login.sub);
      }

      return response;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  // 🎯 STUDENT PROFILE - Keep exact same route
  async getStudentProfile(): Promise<any> {
    const mobileNumber = this.getCurrentUserMobile();
    if (!mobileNumber) {
      throw new Error('No mobile number available');
    }

    // Check cache first
    const cached = studentProfileCache.get(mobileNumber);
    if (cached) {
      console.log('🎯 Returning cached student profile');
      return cached;
    }

    try {
      console.log('🔍 Fetching fresh student profile...');
      const response = await this.makeRequest('/student-profile/1', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kmit_access_token')}`
        }
      });

      if (response && response.payload && response.payload.student) {
        // Cache the profile
        studentProfileCache.set(mobileNumber, response);
        return response;
      }

      throw new Error('Invalid student profile response structure');
    } catch (error) {
      console.error('❌ Failed to fetch student profile:', error);
      throw error;
    }
  }

  // 🎯 ATTENDANCE - Keep exact same route
  async getAttendance(): Promise<any> {
    const mobileNumber = this.getCurrentUserMobile();
    if (!mobileNumber) {
      throw new Error('No mobile number available');
    }

    // Check cache first
    const cached = attendanceCache.get(mobileNumber);
    if (cached) {
      console.log('🎯 Returning cached attendance data');
      return cached;
    }

    try {
      console.log('🔍 Fetching fresh attendance data...');
      const response = await this.makeRequest('/attendance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kmit_access_token')}`
        }
      });

      if (response && response.payload) {
        // Cache the attendance data
        attendanceCache.set(mobileNumber, response);
        return response;
      }

      throw new Error('Invalid attendance response structure');
    } catch (error) {
      console.error('❌ Failed to fetch attendance:', error);
      throw error;
    }
  }

  // 🎯 RESULTS - Keep exact same route
  async getResults(): Promise<any> {
    const mobileNumber = this.getCurrentUserMobile();
    if (!mobileNumber) {
      throw new Error('No mobile number available');
    }

    // Check cache first
    const cached = resultsCache.get(mobileNumber);
    if (cached) {
      console.log('🎯 Returning cached results data');
      return cached;
    }

    try {
      console.log('🔍 Fetching fresh results data...');
      const response = await this.makeRequest('/results/1', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kmit_access_token')}`
        }
      });

      if (response && response.payload) {
        // Cache the results data
        resultsCache.set(mobileNumber, response);
        return response;
      }

      throw new Error('Invalid results response structure');
    } catch (error) {
      console.error('❌ Failed to fetch results:', error);
      throw error;
    }
  }

  // 🎯 INTERNAL RESULTS - Keep exact same route
  async getInternalResults(): Promise<any> {
    const mobileNumber = this.getCurrentUserMobile();
    if (!mobileNumber) {
      throw new Error('No mobile number available');
    }

    // Check cache first
    const cached = resultsCache.get(mobileNumber);
    if (cached) {
      console.log('🎯 Returning cached internal results');
      return cached;
    }

    try {
      console.log('🔍 Fetching internal results...');
      const response = await this.makeRequest('/internal-results', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kmit_access_token')}`
        }
      });

      if (response && response.payload) {
        return response;
      }

      throw new Error('Invalid internal results response structure');
    } catch (error) {
      console.error('❌ Failed to fetch internal results:', error);
      throw error;
    }
  }

  // 🎯 SEMESTER RESULTS - Keep exact same route
  async getSemesterResults(): Promise<any> {
    const mobileNumber = this.getCurrentUserMobile();
    if (!mobileNumber) {
      throw new Error('No mobile number available');
    }

    // Check cache first
    const cached = resultsCache.get(mobileNumber);
    if (cached) {
      console.log('🎯 Returning cached semester results');
      return cached;
    }

    try {
      console.log('🔍 Fetching semester results...');
      const response = await this.makeRequest('/semester-results', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kmit_access_token')}`
        }
      });

      if (response && response.payload) {
        return response;
      }

      throw new Error('Invalid semester results response structure');
    } catch (error) {
      console.error('❌ Failed to fetch semester results:', error);
      throw error;
    }
  }

  // 🎯 TIMETABLE - Keep exact same route
  async getTimetable(): Promise<any> {
    const mobileNumber = this.getCurrentUserMobile();
    if (!mobileNumber) {
      throw new Error('No mobile number available');
    }

    // Check cache first
    const cached = timetableCache.get(mobileNumber);
    if (cached) {
      console.log('🎯 Returning cached timetable');
      return cached;
    }

    try {
      console.log('🔍 Fetching fresh timetable...');
      const response = await this.makeRequest('/timetable', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kmit_access_token')}`
        }
      });

      if (response && response.payload) {
        // Cache the timetable
        timetableCache.set(mobileNumber, response);
        return response;
      }

      throw new Error('Invalid timetable response structure');
    } catch (error) {
      console.error('❌ Failed to fetch timetable:', error);
      throw error;
    }
  }

  // 🎯 SUBJECT ATTENDANCE - Keep exact same route
  async getSubjectAttendance(): Promise<any> {
    const mobileNumber = this.getCurrentUserMobile();
    if (!mobileNumber) {
      throw new Error('No mobile number available');
    }

    // Check cache first
    const cached = attendanceCache.get(mobileNumber);
    if (cached) {
      console.log('🎯 Returning cached subject attendance');
      return cached;
    }

    try {
      console.log('🔍 Fetching subject attendance...');
      const response = await this.makeRequest('/subject-attendance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kmit_access_token')}`
        }
      });

      if (response && response.payload) {
        return response;
      }

      throw new Error('Invalid subject attendance response structure');
    } catch (error) {
      console.error('❌ Failed to fetch subject attendance:', error);
      throw error;
    }
  }

  // 🎯 NOTICES COUNT - Keep exact same route
  async getNoticesCount(): Promise<any> {
    const mobileNumber = this.getCurrentUserMobile();
    if (!mobileNumber) {
      throw new Error('No mobile number available');
    }

    try {
      console.log('🔍 Fetching notices count...');
      const response = await this.makeRequest('/notices-count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kmit_access_token')}`
        }
      });

      if (response) {
        return response;
      }

      throw new Error('Invalid notices count response structure');
    } catch (error) {
      console.error('❌ Failed to fetch notices count:', error);
      throw error;
    }
  }

  // 🎯 SEARCH STUDENTS - Keep exact same route
  async searchStudents(query: string): Promise<any> {
    try {
      console.log('🔍 Searching students...');
      const response = await this.makeRequest(`/search-students?q=${encodeURIComponent(query)}`);

      if (response && response.results) {
        return response;
      }

      throw new Error('Invalid search response structure');
    } catch (error) {
      console.error('❌ Failed to search students:', error);
      throw error;
    }
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

  // 🎯 Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('kmit_access_token');
    return Boolean(token);
  }

  // 🎯 Clear all caches (useful for logout)
  clearCaches(): void {
    cacheManager.clear();
    console.log('🧹 All caches cleared');
  }

  // 🎯 Get cache statistics
  getCacheStats() {
    return cacheManager.getStats();
  }
}

// 🎯 Create and export the optimized API client
export const optimizedApiClient = new OptimizedAPIClient('https://vichaar-kappa.vercel.app/api');
