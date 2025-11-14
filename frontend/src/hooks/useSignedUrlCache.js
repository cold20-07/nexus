import { useState, useCallback, useRef } from 'react';

/**
 * useSignedUrlCache Hook
 * Caches signed URLs with expiration to avoid regenerating them unnecessarily
 * 
 * @param {number} expiryMinutes - Cache expiry time in minutes (default: 55 minutes)
 * @returns {object} - Cache methods
 */
export function useSignedUrlCache(expiryMinutes = 55) {
  const cacheRef = useRef(new Map());

  /**
   * Get a cached URL or generate a new one
   * @param {string} key - Cache key (usually storage_path)
   * @param {Function} generator - Async function to generate the URL
   * @returns {Promise<string>} - The signed URL
   */
  const getCachedUrl = useCallback(async (key, generator) => {
    const now = Date.now();
    const cached = cacheRef.current.get(key);

    // Return cached URL if it exists and hasn't expired
    if (cached && cached.expiresAt > now) {
      return cached.url;
    }

    // Generate new URL
    const url = await generator();
    
    // Cache the URL with expiration
    const expiresAt = now + (expiryMinutes * 60 * 1000);
    cacheRef.current.set(key, { url, expiresAt });

    return url;
  }, [expiryMinutes]);

  /**
   * Clear a specific cached URL
   */
  const clearCached = useCallback((key) => {
    cacheRef.current.delete(key);
  }, []);

  /**
   * Clear all cached URLs
   */
  const clearAll = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    getCachedUrl,
    clearCached,
    clearAll
  };
}

export default useSignedUrlCache;
