// 🚀 Egress Monitor Component - Track Usage & Optimization
// This helps monitor your Supabase egress usage and cache performance

import React, { useState, useEffect } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  Database,
  Wifi,
  Clock,
  Zap
} from 'lucide-react';
import { getCacheStats } from '@/lib/cache';

interface EgressData {
  current: number;
  limit: number;
  percentage: number;
  isOverLimit: boolean;
}

interface CacheStats {
  total: number;
  expired: number;
  valid: number;
  hitRate: number;
}

interface OptimizationMetrics {
  apiCallsReduced: number;
  cacheHitRate: number;
  estimatedSavings: number;
}

export default function EgressMonitor() {
  const [egressData, setEgressData] = useState<EgressData>({
    current: 10.14, // Your current usage
    limit: 5, // Free plan limit
    percentage: 203,
    isOverLimit: true
  });
  
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    total: 0,
    expired: 0,
    valid: 0,
    hitRate: 0
  });
  
  const [optimizationMetrics, setOptimizationMetrics] = useState<OptimizationMetrics>({
    apiCallsReduced: 0,
    cacheHitRate: 0,
    estimatedSavings: 0
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // 🎯 Update cache statistics
  const updateCacheStats = () => {
    try {
      const stats = getCacheStats();
      
      const hitRate = stats.total > 0 ? (stats.valid / stats.total) * 100 : 0;
      
      setCacheStats({
        total: stats.total,
        expired: stats.expired,
        valid: stats.valid,
        hitRate: Math.round(hitRate)
      });
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
    }
  };

  // 🎯 Calculate optimization metrics
  const calculateOptimizationMetrics = () => {
    const hitRate = cacheStats.hitRate;
    const estimatedApiCallsReduced = Math.round(hitRate / 10); // Rough estimate
    const estimatedSavings = Math.round((hitRate / 100) * egressData.current);
    
    setOptimizationMetrics({
      apiCallsReduced: estimatedApiCallsReduced,
      cacheHitRate: hitRate,
      estimatedSavings: estimatedSavings
    });
  };

  // 🎯 Update data periodically
  useEffect(() => {
    updateCacheStats();
    calculateOptimizationMetrics();
    
    const interval = setInterval(() => {
      updateCacheStats();
      calculateOptimizationMetrics();
      setLastUpdated(new Date());
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [cacheStats.hitRate, egressData.current]);

  // 🎯 Get status color based on usage
  const getStatusColor = () => {
    if (egressData.isOverLimit) return 'text-red-500';
    if (egressData.percentage > 80) return 'text-yellow-500';
    return 'text-green-500';
  };

  // 🎯 Get status icon
  const getStatusIcon = () => {
    if (egressData.isOverLimit) return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (egressData.percentage > 80) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  // 🎯 Get progress bar color
  const getProgressColor = () => {
    if (egressData.isOverLimit) return 'bg-red-500';
    if (egressData.percentage > 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 🎯 Compact Status Bar */}
      <div 
        className={`
          bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 
          ${egressData.isOverLimit ? 'border-red-500' : 'border-green-500'}
          cursor-pointer transition-all duration-300 hover:scale-105
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="p-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Egress Usage
              </div>
              <div className={`text-lg font-bold ${getStatusColor()}`}>
                {egressData.current.toFixed(2)} GB
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">
                {egressData.percentage}%
              </div>
              <div className="text-xs text-gray-400">
                of {egressData.limit} GB
              </div>
            </div>
          </div>
          
          {/* 🎯 Progress Bar */}
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${Math.min(egressData.percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 🎯 Expanded Details Panel */}
      {isExpanded && (
        <div className="mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Egress Monitor
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>

          {/* 🎯 Current Usage */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Usage</span>
              <span className={`font-semibold ${getStatusColor()}`}>
                {egressData.current.toFixed(2)} GB
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Free Plan Limit: {egressData.limit} GB</span>
              <span>{egressData.percentage}% used</span>
            </div>
          </div>

          {/* 🎯 Cache Performance */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Database className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Cache Performance
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                <div className="text-blue-600 dark:text-blue-400 font-semibold">
                  {cacheStats.valid}
                </div>
                <div className="text-blue-500 dark:text-blue-300">Valid</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                <div className="text-green-600 dark:text-green-400 font-semibold">
                  {cacheStats.hitRate}%
                </div>
                <div className="text-green-500 dark:text-green-300">Hit Rate</div>
              </div>
            </div>
          </div>

          {/* 🎯 Optimization Impact */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Optimization Impact
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">API Calls Reduced:</span>
                <span className="font-semibold text-green-600">
                  ~{optimizationMetrics.apiCallsReduced}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Estimated Savings:</span>
                <span className="font-semibold text-green-600">
                  ~{optimizationMetrics.estimatedSavings.toFixed(2)} GB
                </span>
              </div>
            </div>
          </div>

          {/* 🎯 Recommendations */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Recommendations
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {egressData.isOverLimit ? (
                <>
                  <div>• 🚨 You're over the free plan limit</div>
                  <div>• 💾 Increase cache TTL values</div>
                  <div>• 🔍 Implement search debouncing</div>
                  <div>• 📱 Consider upgrading plan</div>
                </>
              ) : (
                <>
                  <div>• ✅ Usage within limits</div>
                  <div>• 💾 Cache is working well</div>
                  <div>• 🔍 Continue monitoring</div>
                </>
              )}
            </div>
          </div>

          {/* 🎯 Last Updated */}
          <div className="text-xs text-gray-400 text-center">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}

// 🎯 Export a hook for programmatic access
export const useEgressMonitor = () => {
  const [isVisible, setIsVisible] = useState(true);
  
  const hide = () => setIsVisible(false);
  const show = () => setIsVisible(true);
  const toggle = () => setIsVisible(!isVisible);
  
  return {
    isVisible,
    hide,
    show,
    toggle
  };
};
