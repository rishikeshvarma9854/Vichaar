// 🚀 Optimized Search Hook - Reduce API Calls & Egress
// This implements debouncing, caching, and smart search strategies

import { useState, useEffect, useCallback, useRef } from 'react';
import { searchResultsCache } from '@/lib/cache';

export interface SearchOptions {
  debounceDelay?: number; // Delay before search (default: 500ms)
  minQueryLength?: number; // Minimum characters before searching (default: 2)
  cacheResults?: boolean; // Whether to cache search results (default: true)
  maxResults?: number; // Maximum results to return (default: 50)
}

export interface SearchState<T> {
  query: string;
  results: T[];
  isLoading: boolean;
  hasSearched: boolean;
  error: string | null;
  cacheHit: boolean;
}

export function useOptimizedSearch<T>(
  searchFunction: (query: string) => Promise<T[]>,
  options: SearchOptions = {}
): [
  SearchState<T>,
  (query: string) => void,
  () => void,
  () => void
] {
  const {
    debounceDelay = 500,
    minQueryLength = 2,
    cacheResults = true,
    maxResults = 50
  } = options;

  // State management
  const [state, setState] = useState<SearchState<T>>({
    query: '',
    results: [],
    isLoading: false,
    hasSearched: false,
    error: null,
    cacheHit: false
  });

  // Refs for debouncing and tracking
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>('');

  // 🎯 Debounced search function
  const debouncedSearch = useCallback((query: string) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Cancel ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      performSearch(query);
    }, debounceDelay);
  }, [debounceDelay]);

  // 🎯 Perform the actual search
  const performSearch = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    
    // Validate query length
    if (trimmedQuery.length < minQueryLength) {
      setState(prev => ({
        ...prev,
        query: trimmedQuery,
        results: [],
        hasSearched: false,
        error: null,
        cacheHit: false
      }));
      return;
    }

    // Check if query is same as last search
    if (trimmedQuery === lastQueryRef.current) {
      return; // Skip duplicate searches
    }

    lastQueryRef.current = trimmedQuery;

    // Check cache first if enabled
    if (cacheResults) {
      const cachedResults = searchResultsCache.get<T[]>(trimmedQuery);
      if (cachedResults) {
        console.log('🎯 Cache hit for query:', trimmedQuery);
        setState(prev => ({
          ...prev,
          query: trimmedQuery,
          results: cachedResults.slice(0, maxResults),
          hasSearched: true,
          isLoading: false,
          error: null,
          cacheHit: true
        }));
        return;
      }
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      query: trimmedQuery,
      isLoading: true,
      error: null,
      cacheHit: false
    }));

    try {
      console.log('🔍 Performing search for:', trimmedQuery);
      
      const results = await searchFunction(trimmedQuery);
      
      // Check if request was cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Limit results
      const limitedResults = results.slice(0, maxResults);

      // Cache results if enabled
      if (cacheResults && limitedResults.length > 0) {
        searchResultsCache.set(trimmedQuery, limitedResults);
        console.log('💾 Cached search results for:', trimmedQuery);
      }

      setState(prev => ({
        ...prev,
        results: limitedResults,
        hasSearched: true,
        isLoading: false,
        error: null,
        cacheHit: false
      }));

    } catch (error) {
      // Check if request was cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error('❌ Search error:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Search failed',
        cacheHit: false
      }));
    }
  }, [searchFunction, minQueryLength, cacheResults, maxResults]);

  // 🎯 Update search query
  const setQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));
    debouncedSearch(query);
  }, [debouncedSearch]);

  // 🎯 Clear search
  const clearSearch = useCallback(() => {
    // Clear timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Cancel ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      query: '',
      results: [],
      isLoading: false,
      hasSearched: false,
      error: null,
      cacheHit: false
    });

    lastQueryRef.current = '';
  }, []);

  // 🎯 Refresh search (force new search)
  const refreshSearch = useCallback(() => {
    if (state.query.trim().length >= minQueryLength) {
      // Clear cache for this query to force fresh search
      if (cacheResults) {
        searchResultsCache.delete(state.query);
      }
      performSearch(state.query);
    }
  }, [state.query, minQueryLength, cacheResults, performSearch]);

  // 🎯 Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 🎯 Log search statistics
  useEffect(() => {
    if (state.hasSearched) {
      console.log('📊 Search Stats:', {
        query: state.query,
        resultsCount: state.results.length,
        cacheHit: state.cacheHit,
        isLoading: state.isLoading,
        error: state.error
      });
    }
  }, [state.hasSearched, state.query, state.results.length, state.cacheHit, state.isLoading, state.error]);

  return [state, setQuery, clearSearch, refreshSearch];
}

// 🎯 Specialized search hook for student search
export function useStudentSearch() {
  const searchStudents = async (query: string) => {
    // Import your actual search function here
    // For now, this is a placeholder
    const { data, error } = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    
    if (error) throw error;
    return data || [];
  };

  return useOptimizedSearch(searchStudents, {
    debounceDelay: 500,
    minQueryLength: 2,
    cacheResults: true,
    maxResults: 20
  });
}

// 🎯 Hook for monitoring search performance
export function useSearchPerformance() {
  const [stats, setStats] = useState({
    totalSearches: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0
  });

  const updateStats = useCallback((cacheHit: boolean, responseTime: number) => {
    setStats(prev => {
      const totalSearches = prev.totalSearches + 1;
      const cacheHits = prev.cacheHits + (cacheHit ? 1 : 0);
      const cacheMisses = prev.cacheMisses + (cacheHit ? 0 : 1);
      
      // Calculate running average
      const averageResponseTime = prev.averageResponseTime === 0 
        ? responseTime 
        : (prev.averageResponseTime * (totalSearches - 1) + responseTime) / totalSearches;

      return {
        totalSearches,
        cacheHits,
        cacheMisses,
        averageResponseTime
      };
    });
  }, []);

  const getCacheHitRate = useCallback(() => {
    if (stats.totalSearches === 0) return 0;
    return (stats.cacheHits / stats.totalSearches) * 100;
  }, [stats]);

  return {
    stats,
    updateStats,
    getCacheHitRate
  };
}
