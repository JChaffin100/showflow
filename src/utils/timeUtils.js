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
 */
export function easternToLocalDate(dateStr, airtime) {
  // Alias for compatibility if still used anywhere
  return convertEasternToLocal(dateStr, airtime);
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
    // TVmaze returns Eastern broadcast times. We specifically want to treat these 
    // as Local Time so that broadcast primetime (e.g. 8 PM ABC) aligns with local 
    // schedules across the US, matching user expectations for TV listings.
    const [hours, minutes] = airtime.split(':').map(Number);
    const d = new Date(`${dateStr}T00:00:00`);
    d.setHours(hours, minutes, 0, 0);
    return d;
  } catch (e) {
    console.error('Error parsing time:', e);
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

/**
 * Get the day-of-month of the Nth Sunday in a given month/year.
 * @param {number} year
 * @param {number} month - 1-indexed
 * @param {number} n - which Sunday (1 = first, 2 = second, etc.)
 */
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
