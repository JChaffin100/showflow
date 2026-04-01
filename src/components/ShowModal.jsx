import React, { useEffect, useRef } from 'react';
import { stripHtml } from '../utils/channelUtils';
import { formatShortTime, convertEasternToLocal } from '../utils/timeUtils';

export default function ShowModal({ episode, onClose }) {
  const modalRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!episode) return null;

  const show = episode.show || {};
  const showName = show.name || 'Unknown Show';
  const episodeName = episode.name || '';
  const network = show.network?.name || show.webChannel?.name || '';
  const genres = show.genres || [];
  const rating = show.rating?.average;
  const image = show.image?.medium || show.image?.original;
  const summary = stripHtml(episode.summary || show.summary || '');
  const season = episode.season;
  const number = episode.number;
  const runtime = episode.runtime;

  const airtime = episode.airtime;
  const airdate = episode.airdate;
  const localTime = airtime && airdate ? convertEasternToLocal(airdate, airtime) : null;

  const renderStars = (rating) => {
    if (!rating) return null;
    const normalized = rating / 10; // TVmaze is 0-10
    const stars = Math.round(normalized * 5);
    return (
      <span className="rating">
        {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
        <span className="rating-num"> {rating}/10</span>
      </span>
    );
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-show-title"
    >
      <div className="modal-content" ref={modalRef}>
        <button
          className="modal-close"
          onClick={onClose}
          ref={closeRef}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="modal-body">
          <div className="modal-poster">
            {image ? (
              <img src={image} alt={showName} className="poster-img" />
            ) : (
              <div className="poster-placeholder">
                <span>📺</span>
              </div>
            )}
          </div>

          <div className="modal-info">
            <h2 id="modal-show-title" className="modal-show-name">{showName}</h2>

            <div className="modal-meta">
              {network && <span className="network-tag">{network}</span>}
              {genres.map(g => (
                <span key={g} className="genre-tag">{g}</span>
              ))}
            </div>

            {localTime && (
              <div className="modal-airtime">
                🕐 {formatShortTime(localTime)}
                {runtime && <span className="modal-runtime"> · {runtime} min</span>}
              </div>
            )}

            {season && number && (
              <div className="modal-episode-num">
                Season {season}, Episode {number}
              </div>
            )}

            {episodeName && (
              <div className="modal-episode-title">"{episodeName}"</div>
            )}

            {rating && (
              <div className="modal-rating">{renderStars(rating)}</div>
            )}

            <div className="modal-summary">
              {summary || 'No synopsis available.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
