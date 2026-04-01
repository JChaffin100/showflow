import React, { useState, useEffect } from 'react';
import { timeToPixels, formatShortTime } from '../utils/timeUtils';

export default function NowLine({ gridStart, slotWidth, channelColWidth, totalSlots }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const offset = timeToPixels(now, gridStart, slotWidth);
  const totalWidth = totalSlots * slotWidth;

  if (offset < 0 || offset > totalWidth) return null;

  return (
    <div
      className="now-line"
      style={{ left: channelColWidth + offset }}
      aria-label={`Current time: ${formatShortTime(now)}`}
    >
      <div className="now-line-label">{formatShortTime(now)}</div>
      <div className="now-line-bar" />
    </div>
  );
}
