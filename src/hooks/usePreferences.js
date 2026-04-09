import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_CHANNELS } from '../utils/channelUtils';

const PREFS_KEY = 'showflow_prefs';

const DEFAULT_PREFS = {
  defaultStartTime: '19:00',
  channelOrder: [...DEFAULT_CHANNELS],
  hiddenChannels: [],
  theme: 'system',
  appVersion: null,
};

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const saved = JSON.parse(raw);
    return {
      ...DEFAULT_PREFS,
      ...saved,
      // Ensure channelOrder has all default channels (add any new ones at the end)
      channelOrder: mergeChannelOrder(saved.channelOrder || [], DEFAULT_CHANNELS),
    };
  } catch (e) {
    return { ...DEFAULT_PREFS };
  }
}

function mergeChannelOrder(savedOrder, defaults) {
  // Keep saved order, append any channels not yet in savedOrder
  const set = new Set(savedOrder);
  const merged = [...savedOrder];
  for (const ch of defaults) {
    if (!set.has(ch)) merged.push(ch);
  }
  return merged;
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded when saving preferences');
    }
  }
}

export function usePreferences() {
  const [prefs, setPrefsState] = useState(loadPrefs);

  const setPrefs = useCallback((updater) => {
    setPrefsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      savePrefs(next);
      return next;
    });
  }, []);

  // Apply theme to document whenever theme pref changes
  useEffect(() => {
    const applyTheme = (theme) => {
      let resolved = theme;
      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', resolved);
    };

    applyTheme(prefs.theme);

    if (prefs.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [prefs.theme]);

  const setDefaultStartTime = useCallback((time) => {
    setPrefs(p => ({ ...p, defaultStartTime: time }));
  }, [setPrefs]);

  const setChannelOrder = useCallback((order) => {
    setPrefs(p => ({ ...p, channelOrder: order }));
  }, [setPrefs]);

  const toggleChannel = useCallback((channelName) => {
    setPrefs(p => {
      const hidden = new Set(p.hiddenChannels);
      if (hidden.has(channelName)) {
        hidden.delete(channelName);
      } else {
        hidden.add(channelName);
      }
      return { ...p, hiddenChannels: Array.from(hidden) };
    });
  }, [setPrefs]);

  const resetChannels = useCallback(() => {
    setPrefs(p => ({ ...p, channelOrder: [...DEFAULT_CHANNELS], hiddenChannels: [] }));
  }, [setPrefs]);

  const setTheme = useCallback((theme) => {
    setPrefs(p => ({ ...p, theme }));
  }, [setPrefs]);

  const exportCSV = useCallback(() => {
    const { defaultStartTime, channelOrder, hiddenChannels } = prefs;

    // Helper to escape CSV values (wrap in quotes if contains comma/quote, escape internal quotes)
    const esc = (val) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = [
      ['setting', 'value'],
      ['version', '1.0'],
      ['defaultStartTime', defaultStartTime],
      ['hiddenChannels', hiddenChannels.join(',')],
      ['channelOrder', channelOrder.join(',')],
    ];

    // Build CSV with escaped values and Windows line endings
    const csvContent = rows.map(row => row.map(esc).join(',')).join('\r\n');

    // Add UTF-8 BOM for Windows/Excel compatibility
    const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'showflow-preferences.csv';
    a.style.display = 'none';
    document.body.appendChild(a);

    a.click();

    // Clean up with a delay to ensure the browser has finished the download handoff
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }, [prefs]);

  const importCSV = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          let text = e.target.result;
          if (!text) throw new Error('File is empty');

          // Strip UTF-8 BOM if present
          if (text.startsWith('\uFEFF')) {
            text = text.slice(1);
          }

          // Split by any newline format
          const lines = text.trim().split(/\r?\n/);

          // Relaxed header check (ignore case/whitespace)
          const header = lines[0]?.trim().toLowerCase();
          if (header !== 'setting,value') {
            throw new Error('Invalid format: missing "setting,value" header');
          }

          const parsed = {};
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const commaIdx = line.indexOf(',');
            if (commaIdx === -1) continue;

            const key = line.slice(0, commaIdx).trim();
            // Basic unquoting/cleaning of the value
            let value = line.slice(commaIdx + 1).trim();
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1).replace(/""/g, '"');
            }

            if (key) parsed[key] = value;
          }

          const newPrefs = { ...prefs };
          if (parsed.defaultStartTime) {
            newPrefs.defaultStartTime = parsed.defaultStartTime;
          }
          if (parsed.channelOrder) {
            newPrefs.channelOrder = parsed.channelOrder.split(',').map(s => s.trim()).filter(Boolean);
          }
          if (parsed.hiddenChannels !== undefined) {
            newPrefs.hiddenChannels = parsed.hiddenChannels ? parsed.hiddenChannels.split(',').map(s => s.trim()).filter(Boolean) : [];
          }

          setPrefs(newPrefs);
          resolve('Preferences imported successfully');
        } catch (err) {
          reject(err.message || 'Invalid preferences file');
        }
      };
      reader.onerror = () => reject('Failed to read file');
      reader.readAsText(file);
    });
  }, [prefs, setPrefs]);

  return {
    prefs,
    setDefaultStartTime,
    setChannelOrder,
    toggleChannel,
    resetChannels,
    setTheme,
    exportCSV,
    importCSV,
  };
}
