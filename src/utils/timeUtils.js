/**
 * Time utilities for ShowFlow
 * TVmaze airtimes are in US Eastern Time ("HH:MM" 24h format).
 * All functions convert to the user's local timezone for display.
 */

// Format a Date object to 12h local time string, e.g. "8:00 PM"
export function formatLocalTime(date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Format a Date object to "h:MM AM/PM" without leading zero
export function formatShortTime(date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

/**
 * Convert a TVmaze airtime string + date string to a local Date object.
 * @param {string} dateStr - "YYYY-MM-DD"
 * @param {string} airtime - "HH:MM" in Eastern time (e.g. "20:00")
 * @returns {Date} local Date object
export function easternToLocalDate(dateStr, airtime) {
  if (!airtime || !dateStr) return null;
  const [hours, minutes] = airtime.split(':').map(Number);
  
  // Build an ISO string treating the time as Eastern
  // We construct a UTC date and then use Intl to find the offset
  const isoString = `${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  
  // Get the ET offset for this moment by constructing the target date
  const testDate = new Date(`${dateStr}T12:00:00Z`);
  const etFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const etParts = etFormatter.formatToParts(testDate);
  const etYear = etParts.find(p => p.type === 'year')?.value;
  const etMonth = etParts.find(p => p.type === 'month')?.value;
  const etDay = etParts.find(p => p.type === 'day')?.value;

  // Find the UTC offset for America/New_York on this date
  const utcMs = testDate.getTime();
  const etDisplayDate = new Date(`${etYear}-${etMonth}-${etDay}T12:00:00Z`);
  const offset = utcMs - etDisplayDate.getTime();

  // Create the target ET time as UTC, then adjust by offset
  const targetUtc = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`);
  return new Date(targetUtc.getTime() + offset);
}

/**
 * More robust ET to local conversion using Intl API.
 * @param {string} dateStr - "YYYY-MM-DD"
 * @param {string} airtime - "HH:MM" in Eastern time
 * @returns {Date} local Date object
 */
export function convertEasternToLocal(dateStr, airtime) {
  if (!airtime || !dateStr) return null;
  try {
    const [hours, minutes] = airtime.split(':').map(Number);

    // Manual offset based on US DST rules
    const month = parseInt(dateStr.split('-')[1], 10);
    const day = parseInt(dateStr.split('-')[2], 10);
    const year = parseInt(dateStr.split('-')[0], 10);

    const isDST = isEasternDST(year, month, day, hours);
    const offsetHours = isDST ? 4 : 5; // UTC-4 EDT, UTC-5 EST

    const utcHours = hours + offsetHours;
    let utcDate = dateStr;
    let finalHours = utcHours;

    if (finalHours >= 24) {
      finalHours -= 24;
      const d = new Date(`${dateStr}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 1);
      utcDate = d.toISOString().split('T')[0];
    }

    const utcString = `${utcDate}T${String(finalHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`;
    return new Date(utcString);
  } catch (e) {
    console.error('Error converting ET to local:', e);
    return null;
  }
}

/**
 * Determine if a given date/time is in Eastern Daylight Time (UTC-4).
 * DST: Second Sunday in March at 2:00 AM to First Sunday in November at 2:00 AM
 */
function isEasternDST(year, month, day, hour = 0) {
  const dstStart = nthSundayOfMonth(year, 3, 2); // March, 2nd Sunday
  const dstEnd = nthSundayOfMonth(year, 11, 1);   // November, 1st Sunday

  const current = new Date(year, month - 1, day, hour);
  const start = new Date(year, 2, dstStart, 2); // March, 2:00 AM
  const end = new Date(year, 10, dstEnd, 2);    // November, 2:00 AM

  return current >= start && current < end;
}

function nthSundayOfMonth(year, month, n) {
  let count = 0;
  for (let day = 1; day <= 31; day++) {
    const d = new Date(year, month - 1, day);
    if (d.getMonth() !== month - 1) break;
    if (d.getDay() === 0) {
      count++;
      if (count === n) return day;
    }
  }
  return 1;
}


/**
 * Get an array of date strings for today + next N days.
 * @param {number} n - number of days ahead (default 6)
 * @returns {string[]} array of "YYYY-MM-DD" strings
 */
export function getDateRange(n = 6) {
  const dates = [];
  const today = new Date();
  for (let i = -1; i <= n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(toDateString(d));
  }
  return dates;
}

/**
 * Get today's date string.
 */
export function getTodayString() {
  return toDateString(new Date());
}

/**
 * Convert Date to "YYYY-MM-DD" string in local time.
 */
export function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format a date string for display (e.g. "Today", "Tomorrow", "Mon Jan 6")
 */
export function formatDateLabel(dateStr) {
  const today = getTodayString();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toDateString(d);
  })();
  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toDateString(d);
  })();

  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  if (dateStr === tomorrow) return 'Tomorrow';

  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Parse a time string "HH:MM" and return { hours, minutes }
 */
export function parseTimeString(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Given a dateStr and a start time "HH:MM" (local), return an array of
 * slot Date objects at 30-min intervals for `count` slots.
 */
export function getTimeSlots(dateStr, startTimeStr, count = 12) {
  const { hours, minutes } = parseTimeString(startTimeStr);
  const slots = [];
  const base = new Date(dateStr + 'T00:00:00');
  base.setHours(hours, minutes, 0, 0);
  for (let i = 0; i < count; i++) {
    const slot = new Date(base.getTime() + i * 30 * 60 * 1000);
    slots.push(slot);
  }
  return slots;
}

/**
 * Compute the pixel offset from the start of the grid to a given time.
 * @param {Date} time - the target time
 * @param {Date} gridStart - the start time of the grid
 * @param {number} slotWidth - width in px of a 30-min slot
 * @returns {number} pixel offset
 */
export function timeToPixels(time, gridStart, slotWidth) {
  const diffMs = time.getTime() - gridStart.getTime();
  const diffMinutes = diffMs / 60000;
  return (diffMinutes / 30) * slotWidth;
}

/**
 * Generate time options for the start time dropdown.
 * 30-min increments from 6:00 AM to 2:00 AM next day.
 */
export function getStartTimeOptions() {
  const options = [];
  // 6:00 AM (6) to 23:30 (11:30 PM)
  for (let h = 6; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const label = formatTimeStrToDisplay(timeStr);
      options.push({ value: timeStr, label });
    }
  }
  // 0:00 AM and 0:30 AM and 1:00 AM and 1:30 AM and 2:00 AM
  for (let h = 0; h <= 2; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 2 && m > 0) break;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const label = formatTimeStrToDisplay(timeStr);
      options.push({ value: timeStr, label });
    }
  }
  return options;
}

/**
 * Format "HH:MM" to display string like "7:00 PM"
 */
export function formatTimeStrToDisplay(timeStr) {
  const { hours, minutes } = parseTimeString(timeStr);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}
