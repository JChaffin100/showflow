import React, { useState, useRef, useEffect, useCallback } from 'react';
import { convertEasternToLocal, formatShortTime, formatDateLabel } from '../utils/timeUtils';
import { getTodayString, toDateString } from '../utils/timeUtils';

export default function SearchPanel({ onClose, onNavigate, fetchDateOnDemand, getScheduleForDate }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const getDatesToSearch = useCallback(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i <= 6; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(toDateString(d));
    }
    return dates;
  }, []);

  const search = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const dates = getDatesToSearch();
    const allResults = [];

    for (const dateStr of dates) {
      let data = getScheduleForDate(dateStr);
      if (!data) {
        data = await fetchDateOnDemand(dateStr);
      }
      if (!data) continue;

      const lower = q.toLowerCase();
      const matches = data.filter(ep => {
        const showName = ep.show?.name?.toLowerCase() || '';
        const epName = ep.name?.toLowerCase() || '';
        const network = ep.show?.network?.name?.toLowerCase() || '';
        return showName.includes(lower) || epName.includes(lower) || network.includes(lower);
      });

      for (const ep of matches) {
        const localTime = ep.airdate && ep.airtime
          ? convertEasternToLocal(ep.airdate, ep.airtime)
          : null;
        allResults.push({ ep, dateStr, localTime });
      }
    }

    // Sort by date then by local time
    allResults.sort((a, b) => {
      if (a.dateStr !== b.dateStr) return a.dateStr.localeCompare(b.dateStr);
      if (a.localTime && b.localTime) return a.localTime - b.localTime;
      return 0;
    });

    setResults(allResults);
    setLoading(false);
  }, [getDatesToSearch, getScheduleForDate, fetchDateOnDemand]);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Group results by date
  const grouped = results.reduce((acc, r) => {
    if (!acc[r.dateStr]) acc[r.dateStr] = [];
    acc[r.dateStr].push(r);
    return acc;
  }, {});

  const handleResultClick = (dateStr, localTime) => {
    onNavigate(dateStr, localTime);
    onClose();
  };

  return (
    <div className="panel-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="search-panel" role="dialog" aria-label="Search shows">
        <div className="search-panel-header">
          <input
            ref={inputRef}
            className="search-input"
            type="search"
            placeholder="Search shows, episodes, networks…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search"
          />
          <button className="panel-close" onClick={onClose} aria-label="Close search">✕</button>
        </div>

        <div className="search-results">
          {loading && <div className="search-loading">Searching…</div>}

          {!loading && query && results.length === 0 && (
            <div className="search-empty">No results found for "{query}"</div>
          )}

          {!loading && !query && (
            <div className="search-hint">Type to search across the next 7 days</div>
          )}

          {Object.entries(grouped).map(([dateStr, items]) => (
            <div key={dateStr} className="search-date-group">
              <div className="search-date-label">{formatDateLabel(dateStr)}</div>
              {items.map(({ ep, localTime }, i) => (
                <button
                  key={`${ep.id}-${i}`}
                  className="search-result-item"
                  onClick={() => handleResultClick(dateStr, localTime)}
                >
                  <div className="result-show-name">{ep.show?.name}</div>
                  <div className="result-meta">
                    <span className="result-episode">{ep.name}</span>
                    {ep.show?.network?.name && (
                      <span className="result-network">{ep.show.network.name}</span>
                    )}
                    {localTime && (
                      <span className="result-time">{formatShortTime(localTime)}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
