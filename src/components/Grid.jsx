import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import ChannelCell from './ChannelCell';
import ShowBlock from './ShowBlock';
import RerunBlock from './RerunBlock';
import NowLine from './NowLine';
import TimeHeader from './TimeHeader';
import { convertEasternToLocal, getTimeSlots, toDateString } from '../utils/timeUtils';
import { groupByChannel } from '../utils/channelUtils';

const SLOT_WIDTH = 120; // px per 30 min
const CHANNEL_COL_WIDTH = 100; // px for channel label column
const NUM_SLOTS = 16; // 8 hours visible minimum (16 × 30min)
const ROW_HEIGHT = 56; // px

export default function Grid({
  scheduleData,
  selectedDate,
  startTime,
  channelOrder,
  hiddenChannels,
  onShowClick,
  gridScrollRef,
}) {
  const scrollContainerRef = useRef(null);
  const headerScrollRef = useRef(null);

  // Pass scroll ref up to parent for "Now" button
  useEffect(() => {
    if (gridScrollRef) gridScrollRef.current = scrollContainerRef.current;
  }, [gridScrollRef]);

  const visibleChannels = useMemo(() =>
    channelOrder.filter(ch => !hiddenChannels.includes(ch)),
    [channelOrder, hiddenChannels]
  );

  // Build time slots from startTime
  const slots = useMemo(() =>
    getTimeSlots(selectedDate, startTime, NUM_SLOTS),
    [selectedDate, startTime]
  );

  const gridStart = slots[0];
  const gridEnd = new Date(gridStart.getTime() + NUM_SLOTS * 30 * 60 * 1000);

  // Group episodes by channel
  const byChannel = useMemo(() =>
    groupByChannel(scheduleData || [], visibleChannels),
    [scheduleData, visibleChannels]
  );

  // Sync horizontal scroll between header and grid
  const handleScroll = useCallback(() => {
    if (headerScrollRef.current && scrollContainerRef.current) {
      headerScrollRef.current.scrollLeft = scrollContainerRef.current.scrollLeft;
    }
  }, []);

  // Build the row for a channel: ShowBlocks + RerunBlocks filling all slots
  const buildChannelRow = useCallback((channelName) => {
    const episodes = byChannel.get(channelName) || [];

    // Convert episodes to local time and filter to grid window
    const localEpisodes = episodes
      .map(ep => {
        const localStart = ep.airdate && ep.airtime
          ? convertEasternToLocal(ep.airdate, ep.airtime)
          : null;
        return { ...ep, localStart };
      })
      .filter(ep => ep.localStart && ep.localStart < gridEnd &&
        new Date(ep.localStart.getTime() + (ep.runtime || 30) * 60000) > gridStart)
      .sort((a, b) => a.localStart - b.localStart);

    const cells = [];
    let cursor = new Date(gridStart);
    let epIdx = 0;

    while (cursor < gridEnd) {
      const slotEnd = new Date(cursor.getTime() + 30 * 60000);

      if (epIdx < localEpisodes.length) {
        const ep = localEpisodes[epIdx];
        const epStart = ep.localStart;
        const epEnd = new Date(epStart.getTime() + (ep.runtime || 30) * 60000);

        if (epStart <= cursor && epEnd > cursor) {
          // Episode starts at or before cursor
          // Check if this is the start (avoid duplicate rendering)
          if (epStart.getTime() === cursor.getTime() ||
              (epStart < cursor && cells.length === 0)) {
            cells.push(
              <ShowBlock
                key={`${ep.id}-${cursor.getTime()}`}
                episode={ep}
                slotWidth={SLOT_WIDTH}
                onClick={onShowClick}
                localStartTime={ep.localStart}
              />
            );
            // Advance cursor to end of episode
            cursor = epEnd;
            epIdx++;
            continue;
          }
        } else if (epStart > cursor && epStart < slotEnd) {
          // Episode starts mid-slot: fill gap with rerun
          const gapSlots = Math.max(1, Math.round((epStart - cursor) / (30 * 60000)));
          cells.push(<RerunBlock key={`rerun-${cursor.getTime()}`} slotWidth={SLOT_WIDTH} slots={gapSlots} />);
          cursor = new Date(cursor.getTime() + gapSlots * 30 * 60000);
          continue;
        } else if (epStart >= slotEnd) {
          // Next episode is after this slot — fill with rerun
          cells.push(<RerunBlock key={`rerun-${cursor.getTime()}`} slotWidth={SLOT_WIDTH} slots={1} />);
          cursor = slotEnd;
          continue;
        }
      }

      // No more episodes or gap — rerun
      cells.push(<RerunBlock key={`rerun-${cursor.getTime()}`} slotWidth={SLOT_WIDTH} slots={1} />);
      cursor = slotEnd;
    }

    return cells;
  }, [byChannel, gridStart, gridEnd, onShowClick]);

  if (!scheduleData) {
    return (
      <div className="grid-loading">
        <div className="spinner" aria-label="Loading schedule..." />
        <p>Loading schedule…</p>
      </div>
    );
  }

  return (
    <div className="grid-wrapper">
      {/* Sticky time header */}
      <div className="grid-header-row">
        <div className="channel-col-spacer" style={{ width: CHANNEL_COL_WIDTH, minWidth: CHANNEL_COL_WIDTH }} />
        <div className="time-header-scroll" ref={headerScrollRef}>
          <TimeHeader
            slots={slots}
            slotWidth={SLOT_WIDTH}
            channelColWidth={0}
          />
        </div>
      </div>

      {/* Grid body */}
      <div className="grid-body">
        {/* Sticky channel column */}
        <div className="channel-col" style={{ width: CHANNEL_COL_WIDTH, minWidth: CHANNEL_COL_WIDTH }}>
          {visibleChannels.map(ch => (
            <ChannelCell key={ch} name={ch} width={CHANNEL_COL_WIDTH} />
          ))}
        </div>

        {/* Scrollable content area */}
        <div
          className="grid-content"
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          {/* Now line */}
          <NowLine
            gridStart={gridStart}
            slotWidth={SLOT_WIDTH}
            channelColWidth={0}
            totalSlots={NUM_SLOTS}
          />

          {/* Channel rows */}
          {visibleChannels.map(ch => (
            <div key={ch} className="grid-row" style={{ height: ROW_HEIGHT }}>
              {buildChannelRow(ch)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { SLOT_WIDTH, CHANNEL_COL_WIDTH };
