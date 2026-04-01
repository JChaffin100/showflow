import { useState, useEffect, useCallback, useRef } from 'react';
import { getTodayString, toDateString } from '../utils/timeUtils';

const CACHE_PREFIX = 'showflow_schedule_';
const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour
const CACHE_PRUNE_DAYS = 8;
const API_BASE = 'https://api.tvmaze.com';
const USER_AGENT = 'ShowFlow-PWA/1.0';
const TIMEOUT_MS = 10000;
const RETRY_DELAY_MS = 2000;

function getCacheKey(dateStr) {
  return `${CACHE_PREFIX}${dateStr}`;
}

function getFromCache(dateStr) {
  try {
    const raw = localStorage.getItem(getCacheKey(dateStr));
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    return { data, timestamp, isStale: Date.now() - timestamp > CACHE_MAX_AGE_MS };
  } catch (e) {
    return null;
  }
}

function saveToCache(dateStr, data) {
  try {
    localStorage.setItem(getCacheKey(dateStr), JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      // Prune old entries and try again
      pruneCache();
      try {
        localStorage.setItem(getCacheKey(dateStr), JSON.stringify({
          data,
          timestamp: Date.now(),
        }));
      } catch (e2) {
        console.warn('Could not save to cache even after pruning:', e2);
      }
    }
  }
}

function pruneCache() {
  const cutoff = Date.now() - CACHE_PRUNE_DAYS * 24 * 60 * 60 * 1000;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) keys.push(key);
  }
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const { timestamp } = JSON.parse(raw);
      if (timestamp < cutoff) localStorage.removeItem(key);
    } catch (e) {
      localStorage.removeItem(key);
    }
  }
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

async function fetchSchedule(dateStr, retries = 1) {
  const url = `${API_BASE}/schedule?country=US&date=${dateStr}`;
  try {
    const response = await fetchWithTimeout(url);
    if (response.status === 429) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        return fetchSchedule(dateStr, retries - 1);
      }
      throw new Error('Rate limited');
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data;
  } catch (e) {
    throw e;
  }
}

export function useSchedule(selectedDate) {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Prune cache on mount
  useEffect(() => {
    pruneCache();
  }, []);

  const loadSchedule = useCallback(async (dateStr, forceRefresh = false) => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError(null);

    const cached = getFromCache(dateStr);

    // If we have fresh cache and not forcing, use it
    if (cached && !cached.isStale && !forceRefresh) {
      if (mountedRef.current) {
        setScheduleData(cached.data);
        setFromCache(true);
        setIsOffline(false);
        setLoading(false);
      }
      return;
    }

    // Try network
    try {
      const data = await fetchSchedule(dateStr);
      if (mountedRef.current) {
        saveToCache(dateStr, data);
        setScheduleData(data);
        setFromCache(false);
        setIsOffline(false);
        setLoading(false);
      }
    } catch (e) {
      if (!mountedRef.current) return;
      // Fall back to cache
      if (cached) {
        setScheduleData(cached.data);
        setFromCache(true);
        setIsOffline(true);
        setError('Offline — showing cached data');
      } else {
        setScheduleData([]);
        setIsOffline(true);
        setError('No data available for this date. Connect to the internet to load the schedule.');
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadSchedule(selectedDate);
    }
  }, [selectedDate, loadSchedule]);

  // Prefetch adjacent days in the background
  const prefetchDays = useCallback(async (dates) => {
    for (const dateStr of dates) {
      const cached = getFromCache(dateStr);
      if (!cached || cached.isStale) {
        try {
          const data = await fetchSchedule(dateStr);
          saveToCache(dateStr, data);
        } catch (e) {
          // Silent fail for prefetch
        }
        // Small delay between prefetch requests
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }, []);

  const getScheduleForDate = useCallback((dateStr) => {
    const cached = getFromCache(dateStr);
    return cached ? cached.data : null;
  }, []);

  const fetchDateOnDemand = useCallback(async (dateStr) => {
    const cached = getFromCache(dateStr);
    if (cached && !cached.isStale) return cached.data;
    try {
      const data = await fetchSchedule(dateStr);
      saveToCache(dateStr, data);
      return data;
    } catch (e) {
      return cached ? cached.data : [];
    }
  }, []);

  return {
    scheduleData,
    loading,
    error,
    isOffline,
    fromCache,
    loadSchedule,
    prefetchDays,
    getScheduleForDate,
    fetchDateOnDemand,
  };
}
