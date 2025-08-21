// 🚀 Advanced Caching System - Reduce API Calls & Egress
// This will significantly reduce your Supabase egress usage

export interface CacheData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  version?: string; // Cache version for invalidation
  compress?: boolean; // Enable compression for large data
}

class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheData<any>>;
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CACHE_VERSION = '1.0.0';

  private constructor() {
    this.cache = new Map();
    this.loadFromStorage();
    this.cleanupExpired();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // 🎯 Set cache with TTL
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.DEFAULT_TTL;
    const version = options.version || this.CACHE_VERSION;
    
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      version
    };

    // Store in memory
    this.cache.set(key, cacheData);
    
    // Store in localStorage for persistence
    try {
      const compressed = options.compress ? this.compress(data) : data;
      localStorage.setItem(key, JSON.stringify({
        ...cacheData,
        data: compressed
      }));
    } catch (error) {
      console.warn('Failed to store cache in localStorage:', error);
    }
  }

  // 🎯 Get cached data
  get<T>(key: string): T | null {
    // Check memory cache first
    const memoryCache = this.cache.get(key);
    if (memoryCache && Date.now() < memoryCache.expiresAt) {
      return memoryCache.data;
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const cacheData: CacheData<T> = JSON.parse(stored);
        
        if (Date.now() < cacheData.expiresAt) {
          // Restore to memory cache
          this.cache.set(key, cacheData);
          return cacheData.data;
        } else {
          // Expired, remove from storage
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Failed to read cache from localStorage:', error);
    }

    return null;
  }

  // 🎯 Check if cache exists and is valid
  has(key: string): boolean {
    const cached = this.get(key);
    return cached !== null;
  }

  // 🎯 Remove specific cache
  delete(key: string): void {
    this.cache.delete(key);
    localStorage.removeItem(key);
  }

  // 🎯 Clear all caches
  clear(): void {
    this.cache.clear();
    
    // Clear localStorage caches
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_') || key.includes('_cache')) {
        localStorage.removeItem(key);
      }
    });
  }

  // 🎯 Get cache statistics
  getStats(): { total: number; expired: number; valid: number } {
    let expired = 0;
    let valid = 0;
    
    this.cache.forEach((cacheData) => {
      if (Date.now() < cacheData.expiresAt) {
        valid++;
      } else {
        expired++;
      }
    });

    return {
      total: this.cache.size,
      expired,
      valid
    };
  }

  // 🎯 Cleanup expired caches
  private cleanupExpired(): void {
    const now = Date.now();
    
    this.cache.forEach((cacheData, key) => {
      if (now >= cacheData.expiresAt) {
        this.cache.delete(key);
        localStorage.removeItem(key);
      }
    });
  }

  // 🎯 Load caches from localStorage on startup
  private loadFromStorage(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_') || key.includes('_cache')) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const cacheData = JSON.parse(stored);
              if (Date.now() < cacheData.expiresAt) {
                this.cache.set(key, cacheData);
              } else {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to load caches from localStorage:', error);
    }
  }

  // 🎯 Simple compression for large data
  private compress(data: any): any {
    if (typeof data === 'object' && data !== null) {
      // Remove unnecessary fields for caching
      const essential = { ...data };
      delete essential.created_at;
      delete essential.updated_at;
      delete essential.last_updated;
      delete essential.timestamp;
      return essential;
    }
    return data;
  }
}

// 🎯 Specialized cache functions for common use cases
export const studentProfileCache = {
  key: (mobileNumber: string) => `cache_student_profile_${mobileNumber}`,
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  set: <T>(mobileNumber: string, data: T) => {
    const cache = CacheManager.getInstance();
    cache.set(studentProfileCache.key(mobileNumber), data, { 
      ttl: studentProfileCache.ttl,
      compress: true 
    });
  },
  get: <T>(mobileNumber: string): T | null => {
    const cache = CacheManager.getInstance();
    return cache.get(studentProfileCache.key(mobileNumber));
  },
  has: (mobileNumber: string): boolean => {
    const cache = CacheManager.getInstance();
    return cache.has(studentProfileCache.key(mobileNumber));
  }
};

export const searchResultsCache = {
  key: (query: string) => `cache_search_${query.toLowerCase().trim()}`,
  ttl: 2 * 60 * 60 * 1000, // 2 hours
  set: <T>(query: string, data: T) => {
    const cache = CacheManager.getInstance();
    cache.set(searchResultsCache.key(query), data, { 
      ttl: searchResultsCache.ttl,
      compress: true 
    });
  },
  get: <T>(query: string): T | null => {
    const cache = CacheManager.getInstance();
    return cache.get(searchResultsCache.key(query));
  },
  has: (query: string): boolean => {
    const cache = CacheManager.getInstance();
    return cache.has(searchResultsCache.key(query));
  }
};

export const attendanceCache = {
  key: (mobileNumber: string) => `cache_attendance_${mobileNumber}`,
  ttl: 6 * 60 * 60 * 1000, // 6 hours
  set: <T>(mobileNumber: string, data: T) => {
    const cache = CacheManager.getInstance();
    cache.set(attendanceCache.key(mobileNumber), data, { 
      ttl: attendanceCache.ttl,
      compress: true 
    });
  },
  get: <T>(mobileNumber: string): T | null => {
    const cache = CacheManager.getInstance();
    return cache.get(attendanceCache.key(mobileNumber));
  },
  has: (mobileNumber: string): boolean => {
    const cache = CacheManager.getInstance();
    return cache.has(attendanceCache.key(mobileNumber));
  }
};

export const resultsCache = {
  key: (mobileNumber: string) => `cache_results_${mobileNumber}`,
  ttl: 12 * 60 * 60 * 1000, // 12 hours
  set: <T>(mobileNumber: string, data: T) => {
    const cache = CacheManager.getInstance();
    cache.set(resultsCache.key(mobileNumber), data, { 
      ttl: resultsCache.ttl,
      compress: true 
    });
  },
  get: <T>(mobileNumber: string): T | null => {
    const cache = CacheManager.getInstance();
    return cache.get(resultsCache.key(mobileNumber));
  },
  has: (mobileNumber: string): boolean => {
    const cache = CacheManager.getInstance();
    return cache.has(resultsCache.key(mobileNumber));
  }
};

export const timetableCache = {
  key: (mobileNumber: string) => `cache_timetable_${mobileNumber}`,
  ttl: 12 * 60 * 60 * 1000, // 12 hours
  set: <T>(mobileNumber: string, data: T) => {
    const cache = CacheManager.getInstance();
    cache.set(timetableCache.key(mobileNumber), data, { 
      ttl: timetableCache.ttl,
      compress: true 
    });
  },
  get: <T>(mobileNumber: string): T | null => {
    const cache = CacheManager.getInstance();
    return cache.get(timetableCache.key(mobileNumber));
  },
  has: (mobileNumber: string): boolean => {
    const cache = CacheManager.getInstance();
    return cache.has(timetableCache.key(mobileNumber));
  }
};

// 🎯 Export the main cache manager
export const cacheManager = CacheManager.getInstance();

// 🎯 Utility function to get cache stats
export const getCacheStats = () => cacheManager.getStats();

// 🎯 Clear all caches (useful for logout)
export const clearAllCaches = () => cacheManager.clear();
