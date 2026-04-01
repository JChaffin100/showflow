/**
 * Default channel list for ShowFlow.
 * Matches against show.network.name from TVmaze (case-insensitive).
 */

export const DEFAULT_CHANNELS = [
  // Broadcast
  'ABC',
  'NBC',
  'CBS',
  'FOX',
  'PBS',
  'The CW',
  // Cable
  'AMC',
  'CNN',
  'ESPN',
  'ESPN2',
  'FX',
  'FXX',
  'HBO',
  'MSNBC',
  'Fox News',
  'TNT',
  'TBS',
  'USA Network',
  'Bravo',
  'A&E',
  'Discovery',
  'History',
  'HGTV',
  'Food Network',
  'Hallmark Channel',
  'Lifetime',
  'Comedy Central',
  'Cartoon Network',
  'Disney Channel',
  'Nickelodeon',
  'MTV',
  'VH1',
  'BET',
  'Syfy',
  'truTV',
  'OWN',
  'Animal Planet',
  'National Geographic',
  'TLC',
  'E!',
];

/**
 * Normalize a network name for matching.
 */
function normalize(name) {
  return name.toLowerCase().trim();
}

/**
 * Check if a TVmaze network name matches a channel in our list.
 * @param {string} networkName - from TVmaze show.network.name
 * @param {string} channelName - from our DEFAULT_CHANNELS list
 * @returns {boolean}
 */
export function channelMatches(networkName, channelName) {
  if (!networkName || !channelName) return false;
  const net = normalize(networkName);
  const ch = normalize(channelName);
  return net === ch || net.includes(ch) || ch.includes(net);
}

/**
 * Get the channel name from our list that best matches a TVmaze network name.
 * Returns null if no match found.
 */
export function matchChannel(networkName, channelList = DEFAULT_CHANNELS) {
  if (!networkName) return null;
  const net = normalize(networkName);

  // Exact match first
  const exact = channelList.find(ch => normalize(ch) === net);
  if (exact) return exact;

  // Partial match
  const partial = channelList.find(ch => {
    const chN = normalize(ch);
    return net.includes(chN) || chN.includes(net);
  });
  return partial || null;
}

/**
 * Group a list of TVmaze schedule episodes by their matched channel.
 * Returns a Map<channelName, episode[]>
 */
export function groupByChannel(episodes, channelList = DEFAULT_CHANNELS) {
  const map = new Map();
  for (const ch of channelList) {
    map.set(ch, []);
  }

  for (const episode of episodes) {
    const networkName = episode.show?.network?.name || episode.show?.webChannel?.name;
    const matched = matchChannel(networkName, channelList);
    if (matched && map.has(matched)) {
      map.get(matched).push(episode);
    }
  }

  return map;
}

/**
 * Show block color palette — 8 distinct accessible colors.
 * Used to color-code show blocks by a hash of the show name.
 */
export const SHOW_COLORS = [
  { bg: '#1a4f8a', text: '#ffffff', border: '#2563b0' },  // navy blue
  { bg: '#7c2d8b', text: '#ffffff', border: '#9333a0' },  // purple
  { bg: '#0e6b5e', text: '#ffffff', border: '#0d9680' },  // dark teal
  { bg: '#8b3a1a', text: '#ffffff', border: '#c44c20' },  // burnt orange
  { bg: '#1a6b3a', text: '#ffffff', border: '#22a85a' },  // forest green
  { bg: '#6b1a3a', text: '#ffffff', border: '#a02255' },  // deep rose
  { bg: '#1a3a8b', text: '#ffffff', border: '#2550cc' },  // royal blue
  { bg: '#5c4a00', text: '#ffffff', border: '#8a6e00' },  // dark gold
];

/**
 * Get a deterministic color for a show based on its name.
 * Same show always gets the same color.
 */
export function getShowColor(showName) {
  if (!showName) return SHOW_COLORS[0];
  let hash = 0;
  for (let i = 0; i < showName.length; i++) {
    hash = ((hash << 5) - hash) + showName.charCodeAt(i);
    hash |= 0;
  }
  return SHOW_COLORS[Math.abs(hash) % SHOW_COLORS.length];
}

/**
 * Strip HTML tags from a string (for TVmaze summaries).
 */
export function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}
