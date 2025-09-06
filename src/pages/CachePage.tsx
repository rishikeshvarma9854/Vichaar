import React, { useState, useEffect } from 'react';
import { Database, TrendingUp, TrendingDown, Zap, Clock, Shield, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CacheStats {
  total: number;
  valid: number;
  expired: number;
  hit_rate: string;
}

export default function CachePage() {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const navigate = useNavigate();

  // 🔒 ADMIN ACCESS CONTROL - Only you can access this
  const ADMIN_PHONE_NUMBERS = [
    '6301852709', // Replace with your actual phone number
    '9492138384' // Add backup numbers if needed
  ];

  useEffect(() => {
    // Check if user is authorized (you can implement your own auth logic here)
    const checkAuthorization = () => {
      // For now, using a simple prompt - you can enhance this with JWT tokens
      const phoneNumber = prompt('🔒 Admin Access Required\nEnter your phone number:');
      
      if (phoneNumber && ADMIN_PHONE_NUMBERS.includes(phoneNumber)) {
        setIsAuthorized(true);
        fetchCacheStats();
      } else {
        setShowAccessDenied(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    };

    checkAuthorization();
  }, [navigate]);

  const fetchCacheStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://vichaar-kappa.vercel.app/api/cache-stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCacheStats(data.data.cache_stats);
          setLastUpdated(new Date());
        }
      }
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = async () => {
    if (!confirm('⚠️ Are you sure you want to clear ALL cached data? This will force fresh API calls.')) {
      return;
    }

    try {
      const response = await fetch('https://vichaar-kappa.vercel.app/api/cache-clear', {
        method: 'POST'
      });
      if (response.ok) {
        alert('✅ Cache cleared successfully!');
        fetchCacheStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('❌ Failed to clear cache');
    }
  };

  const refreshStats = () => {
    fetchCacheStats();
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAuthorized) return;
    
    const interval = setInterval(fetchCacheStats, 30000);
    return () => clearInterval(interval);
  }, [isAuthorized]);

  if (showAccessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center p-8">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h1>
          <p className="text-red-600 mb-4">You are not authorized to view this page.</p>
          <p className="text-sm text-red-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center p-8">
          <Clock className="w-16 h-16 text-gray-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!cacheStats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Database className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-800">Cache Management Dashboard</h1>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Admin Access</span>
            </div>
            <div className="text-center text-gray-500">
              {isLoading ? 'Loading cache statistics...' : 'No cache data available'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hitRate = parseFloat(cacheStats.hit_rate.replace('%', ''));
  const isGoodPerformance = hitRate > 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Database className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-800">Cache Management Dashboard</h1>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Admin Access</span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={refreshStats}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Clock className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={clearCache}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Clear Cache</span>
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>🎯 This dashboard shows cache performance and helps reduce Supabase egress usage.</p>
            <p>📊 Cache hit rate indicates how effectively we're reducing external API calls.</p>
          </div>
        </div>

        {/* Cache Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">{cacheStats.total}</p>
              </div>
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valid Entries</p>
                <p className="text-2xl font-bold text-green-600">{cacheStats.valid}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired Entries</p>
                <p className="text-2xl font-bold text-red-600">{cacheStats.expired}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hit Rate</p>
                <div className="flex items-center space-x-2">
                  {isGoodPerformance ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  )}
                  <p className={`text-2xl font-bold ${isGoodPerformance ? 'text-green-600' : 'text-red-600'}`}>
                    {cacheStats.hit_rate}
                  </p>
                </div>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Performance Analysis */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Performance Analysis</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-700">Egress Reduction</span>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${isGoodPerformance ? 'text-green-600' : 'text-red-600'}`}>
                  {isGoodPerformance ? '✅ Good Performance' : '⚠️ Needs Improvement'}
                </p>
                <p className="text-sm text-gray-500">
                  {isGoodPerformance 
                    ? 'Cache is effectively reducing API calls' 
                    : 'Low cache hit rate - consider adjusting TTLs'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-green-500" />
                <span className="font-medium text-gray-700">Last Updated</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-700">
                  {lastUpdated?.toLocaleTimeString() || 'Never'}
                </p>
                <p className="text-sm text-gray-500">Auto-refreshes every 30 seconds</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cache Strategy Info */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Cache Strategy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <p><strong>Student Profile:</strong> 5 months (college updates every 5 months)</p>
              <p><strong>Timetable:</strong> 5 months (college updates every 5 months)</p>
              <p><strong>Results:</strong> 12 hours (moderate frequency updates)</p>
            </div>
            <div>
              <p><strong>Notices:</strong> 2 hours (frequent updates)</p>
              <p><strong>Search:</strong> 1 hour (very frequent)</p>
              <p><strong>Attendance:</strong> No caching (faculty updates frequently)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
