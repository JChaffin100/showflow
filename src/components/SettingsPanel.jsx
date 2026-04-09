import React, { useState, useRef, useEffect } from 'react';
import Sortable from 'sortablejs';
import { getStartTimeOptions } from '../utils/timeUtils';

export default function SettingsPanel({
  prefs,
  onClose,
  onSetDefaultStartTime,
  onSetChannelOrder,
  onToggleChannel,
  onResetChannels,
  onSetTheme,
  onExportCSV,
  onImportCSV,
}) {
  const [appVersion, setAppVersion] = useState(null);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const listRef = useRef(null);
  const sortableRef = useRef(null);
  const swRegRef = useRef(null);
  const timeOptions = getStartTimeOptions();

  // Fetch version from service worker
  useEffect(() => {
    const getVersion = async () => {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          const channel = new MessageChannel();
          channel.port1.onmessage = (e) => {
            if (e.data?.version) setAppVersion(e.data.version);
          };
          navigator.serviceWorker.controller.postMessage(
            { type: 'GET_VERSION' },
            [channel.port2]
          );
        }
      } catch (e) {
        console.warn('Could not get SW version:', e);
      }
    };
    getVersion();

    // Store SW registration reference
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => { swRegRef.current = reg; });
    }
  }, []);

  // Initialize SortableJS
  useEffect(() => {
    if (!listRef.current) return;
    sortableRef.current = Sortable.create(listRef.current, {
      animation: 150,
      handle: '.drag-handle',
      onEnd: (evt) => {
        const newOrder = Array.from(listRef.current.querySelectorAll('[data-channel]'))
          .map(el => el.getAttribute('data-channel'));
        onSetChannelOrder(newOrder);
      },
    });
    return () => {
      sortableRef.current?.destroy();
    };
  }, [onSetChannelOrder]);

  // Keyboard close
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleCheckForUpdates = async () => {
    try {
      const reg = swRegRef.current;
      if (!reg) {
        setUpdateStatus("Service worker not available");
        return;
      }
      setUpdateStatus("Checking…");
      await reg.update();

      if (reg.waiting) {
        setUpdateStatus("Update found — reloading in 3s…");
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        setTimeout(() => window.location.reload(), 3000);
      } else {
        const v = appVersion || '1.0.0';
        setUpdateStatus(`You're on the latest version (v${v})`);
        setTimeout(() => setUpdateStatus(null), 3000);
      }
    } catch (e) {
      setUpdateStatus("Could not check for updates");
      setTimeout(() => setUpdateStatus(null), 3000);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const msg = await onImportCSV(file);
      setImportStatus({ type: 'success', msg });
    } catch (err) {
      setImportStatus({ type: 'error', msg: err });
    }
    setTimeout(() => setImportStatus(null), 4000);
    e.target.value = '';
  };

  return (
    <div className="panel-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="settings-panel" role="dialog" aria-label="Settings">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="panel-close" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        <div className="settings-body">

          {/* Channel Management */}
          <section className="settings-section">
            <h3>Channels</h3>
            <p className="settings-hint">Drag to reorder · Toggle to show/hide</p>
            <ul className="channel-list" ref={listRef}>
              {prefs.channelOrder.map(ch => (
                <li key={ch} className="channel-item" data-channel={ch}>
                  <span className="drag-handle" aria-hidden="true">⠿</span>
                  <span className="channel-item-name">{ch}</span>
                  <label className="toggle-switch" title={`${prefs.hiddenChannels.includes(ch) ? 'Show' : 'Hide'} ${ch}`}>
                    <input
                      type="checkbox"
                      checked={!prefs.hiddenChannels.includes(ch)}
                      onChange={() => onToggleChannel(ch)}
                      aria-label={`Toggle ${ch}`}
                    />
                    <span className="toggle-slider" />
                  </label>
                </li>
              ))}
            </ul>
            <button className="btn-secondary" onClick={onResetChannels}>
              Reset to Default Order
            </button>
          </section>

          {/* Preferences */}
          <section className="settings-section">
            <h3>Preferences</h3>

            <div className="settings-row">
              <label htmlFor="settings-start-time">Default Start Time</label>
              <select
                id="settings-start-time"
                value={prefs.defaultStartTime}
                onChange={e => onSetDefaultStartTime(e.target.value)}
              >
                {timeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="settings-row">
              <label>Theme</label>
              <div className="theme-toggle" role="group" aria-label="Theme">
                {['system', 'light', 'dark'].map(t => (
                  <button
                    key={t}
                    className={`theme-btn ${prefs.theme === t ? 'active' : ''}`}
                    onClick={() => onSetTheme(t)}
                    aria-pressed={prefs.theme === t}
                  >
                    {t === 'system' ? '⚙ System' : t === 'light' ? '☀ Light' : '🌙 Dark'}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Import / Export */}
          <section className="settings-section">
            <h3>Data</h3>
            <div className="settings-row settings-row-btns">
              <button className="btn-secondary" onClick={onExportCSV}>
                ↓ Export Preferences CSV
              </button>
              <label className="btn-secondary btn-file-label" htmlFor="import-prefs-input" style={{ cursor: 'pointer' }}>
                ↑ Import Preferences CSV
              </label>
              <input
                id="import-prefs-input"
                type="file"
                accept=".csv,text/csv,text/plain,application/octet-stream,text/comma-separated-values,application/csv,application/x-csv,text/x-csv,.txt"
                onChange={handleImport}
                style={{ position: 'fixed', top: '-100em', left: '-100em', opacity: 0, pointerEvents: 'none' }}
              />
            </div>
            {importStatus && (
              <div className={`import-status ${importStatus.type}`}>
                {importStatus.msg}
              </div>
            )}
          </section>

          {/* About */}
          <section className="settings-section">
            <h3>About</h3>
            <div className="about-block">
              <div className="about-app-name">ShowFlow</div>
              <div className="about-version">
                {appVersion ? `v${appVersion}` : 'Loading version…'}
              </div>
              <div className="about-credit">
                TV schedule data provided by <a href="https://www.tvmaze.com" target="_blank" rel="noopener noreferrer">TVmaze</a>
              </div>
              <button className="btn-primary" onClick={handleCheckForUpdates}>
                Check for Updates
              </button>
              {updateStatus && (
                <div className="update-status">{updateStatus}</div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
