import React, { useState, useEffect } from 'react';
import { Database, TrendingUp, TrendingDown, Zap, Clock } from 'lucide-react';

interface CacheStats {
  total: number;
  valid: number;
  expired: number;
  hit_rate: string;
}

export default function CacheMonitor() {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
    try {
      const response = await fetch('https://vichaar-kappa.vercel.app/api/cache-clear', {
        method: 'POST'
      });
      if (response.ok) {
        toast.success('Cache cleared successfully!');
        fetchCacheStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  useEffect(() => {
    fetchCacheStats();
    // Update every 30 seconds
    const interval = setInterval(fetchCacheStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!cacheStats) {
    return (
      <div className="fixed bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-64">
        <div className="flex items-center space-x-2 mb-2">
          <Database className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium">Cache Monitor</span>
        </div>
        <div className="text-xs text-gray-500">
          {isLoading ? 'Loading...' : 'No data available'}
        </div>
      </div>
    );
  }

  const hitRate = parseFloat(cacheStats.hit_rate.replace('%', ''));
  const isGoodPerformance = hitRate > 50;

  return (
    <div className="fixed bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-64">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium">Cache Monitor</span>
        </div>
        <button
          onClick={clearCache}
          className="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-2 py-1 rounded"
        >
          Clear
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Total Entries:</span>
          <span className="font-semibold">{cacheStats.total}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Valid:</span>
          <span className="font-semibold text-green-600">{cacheStats.valid}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Expired:</span>
          <span className="font-semibold text-red-600">{cacheStats.expired}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Hit Rate:</span>
          <div className="flex items-center space-x-1">
            {isGoodPerformance ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
            <span className={`font-semibold ${isGoodPerformance ? 'text-green-600' : 'text-red-600'}`}>
              {cacheStats.hit_rate}
            </span>
          </div>
        </div>
      </div>

      {lastUpdated && (
        <div className="mt-3 text-xs text-gray-400 text-center">
          <Clock className="w-3 h-3 inline mr-1" />
          {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
        <div className="flex items-center space-x-1 mb-1">
          <Zap className="w-3 h-3 text-blue-500" />
          <span className="font-medium text-blue-700 dark:text-blue-300">Egress Reduction</span>
        </div>
        <div className="text-blue-600 dark:text-blue-400">
          {isGoodPerformance ? '✅ Good cache performance' : '⚠️ Low cache hit rate'}
        </div>
      </div>
    </div>
  );
}
