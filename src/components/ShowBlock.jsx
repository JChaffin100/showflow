import React from 'react';
import { getShowColor } from '../utils/channelUtils';
import { formatShortTime } from '../utils/timeUtils';

export default function ShowBlock({ episode, slotWidth, onClick, localStartTime }) {
  const runtime = episode.runtime || 30;
  const width = Math.max((runtime / 30) * slotWidth - 2, slotWidth - 2);
  const showName = episode.show?.name || 'Unknown Show';
  const episodeName = episode.name || '';
  const season = episode.season;
  const number = episode.number;
  const color = getShowColor(showName);
  const timeLabel = localStartTime ? formatShortTime(localStartTime) : '';

  const ariaLabel = `${showName}${episodeName ? ': ' + episodeName : ''}${timeLabel ? ' at ' + timeLabel : ''}`;

  return (
    <div
      className="show-block"
      style={{
        width,
        minWidth: width,
        backgroundColor: color.bg,
        borderLeft: `3px solid ${color.border}`,
        color: color.text,
      }}
      onClick={() => onClick && onClick(episode)}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick && onClick(episode);
        }
      }}
    >
      <div className="show-block-inner">
        <div className="show-block-header">
          <span className="show-name">{showName}</span>
          <span className="new-badge">NEW</span>
        </div>
        <div className="show-block-footer">
          <span className="episode-name">{episodeName}</span>
          {season && number && (
            <span className="se-badge">S{season} E{number}</span>
          )}
        </div>
      </div>
    </div>
  );
}
