import React from 'react';

export default function RerunBlock({ slotWidth, slots = 1 }) {
  return (
    <div
      className="rerun-block"
      style={{ width: slotWidth * slots, minWidth: slotWidth * slots }}
      aria-hidden="true"
    >
      <span className="rerun-label">Rerun</span>
    </div>
  );
}
