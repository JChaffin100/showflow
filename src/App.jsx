import React, { useState, useRef, useCallback, useEffect } from 'react';
import Grid, { SLOT_WIDTH, CHANNEL_COL_WIDTH } from './components/Grid';
import ShowModal from './components/ShowModal';
import SearchPanel from './components/SearchPanel';
import SettingsPanel from './components/SettingsPanel';
import InstallBanner from './components/InstallBanner';
import { useSchedule } from './hooks/useSchedule';
import { usePreferences } from './hooks/usePreferences';
import {
  getTodayString,
  toDateString,
  formatDateLabel,
  getStartTimeOptions,
  timeToPixels,
  convertEasternToLocal,
} from './utils/timeUtils';

function getDateOptions() {
  const options = [];
  const today = new Date();
  for (let i = -1; i <= 5; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = toDateString(d);
    options.push({ value: dateStr, label: formatDateLabel(dateStr) });
  }
  return options;
}

export default function App() {
  const today = getTodayString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [startTime, setStartTime] = useState(null); // null = use prefs default

  const gridScrollRef = useRef(null);
  const dateOptions = getDateOptions();
  const timeOptions = getStartTimeOptions();

  const {
    prefs,
    setDefaultStartTime,
    setChannelOrder,
    toggleChannel,
    resetChannels,
    setTheme,
    exportCSV,
    importCSV,
  } = usePreferences();

  const {
    scheduleData,
    loading,
    error,
    isOffline,
    loadSchedule,
    prefetchDays,
    getScheduleForDate,
    fetchDateOnDemand,
  } = useSchedule(selectedDate);

  // Effective start time = local override OR pref default
  const effectiveStartTime = startTime || prefs.defaultStartTime;

  // Prefetch next 6 days in background on mount
  useEffect(() => {
    const futureDates = [];
    const today = new Date();
    for (let i = 1; i <= 6; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      futureDates.push(toDateString(d));
    }
    prefetchDays(futureDates);
  }, [prefetchDays]);

  // When prefs load, sync start time if not overridden
  useEffect(() => {
    if (startTime === null) {
      // No-op: we just read from prefs
    }
  }, [prefs.defaultStartTime, startTime]);

  const handleDateChange = (dateStr) => {
    setSelectedDate(dateStr);
    setStartTime(null); // reset to default on date change
  };

  const handleStartTimeChange = (time) => {
    setStartTime(time);
    // Scroll grid to new start time (it's the left edge, so scroll to 0)
    if (gridScrollRef.current) {
      gridScrollRef.current.scrollLeft = 0;
    }
  };

  const scrollToTime = useCallback((targetDate, targetTime) => {
    // Give React time to re-render if date just changed
    setTimeout(() => {
      if (!gridScrollRef.current) return;
      const [h, m] = effectiveStartTime.split(':').map(Number);
      const gridStart = new Date(targetDate + 'T00:00:00');
      gridStart.setHours(h, m, 0, 0);
      const offset = timeToPixels(targetTime, gridStart, SLOT_WIDTH);
      const containerWidth = gridScrollRef.current.clientWidth;
      const scrollTo = Math.max(0, offset - containerWidth / 2);
      gridScrollRef.current.scrollLeft = scrollTo;
    }, 150);
  }, [effectiveStartTime]);

  const scrollToNow = useCallback(() => {
    const now = new Date();
    const todayStr = getTodayString();
    
    if (selectedDate !== todayStr) {
      setSelectedDate(todayStr);
    }
    
    // Snap start time to 1 hr before now, rounded down to half hour
    let startHour = now.getHours() - 1;
    let startMin = now.getMinutes() >= 30 ? 30 : 0;
    if (startHour < 0) {
      startHour = 0;
      startMin = 0;
    }
    
    const newStartTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
    setStartTime(newStartTime);

    // Give the Grid time to re-render with the new start window
    setTimeout(() => {
      if (!gridScrollRef.current) return;
      
      // Calculate offset against the newly set start time
      const gridStart = new Date(`${todayStr}T00:00:00`);
      gridStart.setHours(startHour, startMin, 0, 0);
      
      const offset = timeToPixels(now, gridStart, SLOT_WIDTH);
      const containerWidth = gridScrollRef.current.clientWidth;
      const scrollTo = Math.max(0, offset - containerWidth / 2);
      
      // Use smooth scroll
      gridScrollRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
    }, 150);
  }, [selectedDate]);

  const handleSearchNavigate = useCallback((dateStr, localTime, episode) => {
    setSelectedDate(dateStr);
    setStartTime(null);
    // Open the show modal
    if (episode) setSelectedEpisode(episode);
    // Scroll grid to the show's time slot
    if (localTime) scrollToTime(dateStr, localTime);
  }, [scrollToTime]);

  const handleSetDefaultStartTime = (time) => {
    setDefaultStartTime(time);
    setStartTime(time);
  };

  return (
    <div className="app">
      <InstallBanner />

      {/* Toolbar */}
      <header className="toolbar">
        <div className="toolbar-logo">
          <img src="/showflow/icons/icon-32.png" alt="" className="toolbar-icon" aria-hidden="true" />
          <span className="toolbar-wordmark">ShowFlow</span>
        </div>

        <div className="toolbar-controls">
          {/* Date picker */}
          <select
            className="toolbar-select date-select"
            value={selectedDate}
            onChange={e => handleDateChange(e.target.value)}
            aria-label="Select date"
          >
            {dateOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Start time picker */}
          <select
            className="toolbar-select time-select"
            value={effectiveStartTime}
            onChange={e => handleStartTimeChange(e.target.value)}
            aria-label="Start time"
          >
            {timeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Now button */}
          <button className="toolbar-btn now-btn" onClick={scrollToNow} aria-label="Jump to current time">
            Now
          </button>

          {/* Search */}
          <button
            className="toolbar-btn icon-btn"
            onClick={() => setShowSearch(true)}
            aria-label="Search shows"
          >
            🔍
          </button>

          {/* Settings */}
          <button
            className="toolbar-btn icon-btn"
            onClick={() => setShowSettings(true)}
            aria-label="Open settings"
          >
            ⚙
          </button>
        </div>
      </header>

      {/* Offline / error banner */}
      {error && (
        <div className="offline-banner" role="alert">
          {isOffline ? '📡 ' : '⚠️ '}{error}
        </div>
      )}

      {/* Main grid */}
      <main className="main-content">
        {loading && !scheduleData ? (
          <div className="grid-loading">
            <div className="spinner" aria-label="Loading…" />
            <p>Loading schedule…</p>
          </div>
        ) : (
          <Grid
            scheduleData={scheduleData || []}
            selectedDate={selectedDate}
            startTime={effectiveStartTime}
            channelOrder={prefs.channelOrder}
            hiddenChannels={prefs.hiddenChannels}
            onShowClick={setSelectedEpisode}
            gridScrollRef={gridScrollRef}
          />
        )}
      </main>

      {/* Modals and panels */}
      {selectedEpisode && (
        <ShowModal
          episode={selectedEpisode}
          onClose={() => setSelectedEpisode(null)}
        />
      )}

      {showSearch && (
        <SearchPanel
          onClose={() => setShowSearch(false)}
          onNavigate={handleSearchNavigate}
          fetchDateOnDemand={fetchDateOnDemand}
          getScheduleForDate={getScheduleForDate}
        />
      )}

      {showSettings && (
        <SettingsPanel
          prefs={prefs}
          onClose={() => setShowSettings(false)}
          onSetDefaultStartTime={handleSetDefaultStartTime}
          onSetChannelOrder={setChannelOrder}
          onToggleChannel={toggleChannel}
          onResetChannels={resetChannels}
          onSetTheme={setTheme}
          onExportCSV={exportCSV}
          onImportCSV={importCSV}
        />
      )}
    </div>
  );
}
