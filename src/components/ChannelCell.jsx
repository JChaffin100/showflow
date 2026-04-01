import React from 'react';

export default function ChannelCell({ name, width }) {
  return (
    <div
      className="channel-cell"
      style={{ width, minWidth: width }}
      title={name}
    >
      <span className="channel-name">{name}</span>
    </div>
  );
}
