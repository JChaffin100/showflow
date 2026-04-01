import React from 'react';
import { formatShortTime } from '../utils/timeUtils';

export default function TimeHeader({ slots, slotWidth, channelColWidth }) {
  return (
    <div className="time-header" style={{ paddingLeft: channelColWidth }}>
      {slots.map((slot, i) => (
        <div
          key={i}
          className="time-slot-label"
          style={{ width: slotWidth, minWidth: slotWidth }}
        >
          {formatShortTime(slot)}
        </div>
      ))}
    </div>
  );
}
