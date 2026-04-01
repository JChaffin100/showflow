# ShowFlow — Claude Code Build Instructions

## Project Overview

Build **ShowFlow**, a personal TV listings Progressive Web App (PWA) powered by the free TVmaze public API. This is a single-user personal app with no backend, no authentication, and no database. All data is fetched client-side; all preferences are stored in `localStorage`.

---

## Tech Stack Guidance

Choose the most appropriate stack for a polished, maintainable PWA of this complexity. React + Vite is recommended given the interactive grid, state management needs, and component reuse — but use your best judgment. The final deliverable must be deployable to **GitHub Pages** as a static site with no server-side rendering required.

---

## Project Structure

```
showflow/
├── public/
│   ├── icons/           ← All PWA icon sizes (generated from SVG — see Icon section)
│   ├── manifest.json
│   └── sw.js            ← Service worker
├── src/
│   ├── components/
│   │   ├── Grid.jsx         ← Main EPG grid
│   │   ├── ChannelCell.jsx  ← Sticky left channel label
│   │   ├── ShowBlock.jsx    ← Individual show block in grid
│   │   ├── RerunBlock.jsx   ← Gray placeholder for unlisted timeslots
│   │   ├── ShowModal.jsx    ← Click-through episode detail modal
│   │   ├── SearchPanel.jsx  ← Search overlay
│   │   ├── SettingsPanel.jsx← Channel management + preferences
│   │   ├── TimeHeader.jsx   ← Scrolling time column headers
│   │   ├── NowLine.jsx      ← Vertical current-time indicator
│   │   └── InstallBanner.jsx← PWA install prompt
│   ├── hooks/
│   │   ├── useSchedule.js   ← TVmaze API fetching + caching
│   │   └── usePreferences.js← localStorage read/write
│   ├── utils/
│   │   ├── timeUtils.js     ← Timezone conversion, slot math
│   │   └── channelUtils.js  ← Default channel list, matching logic
│   ├── App.jsx
│   └── main.jsx
├── showflow-icon.svg    ← Master icon SVG (see Icon section)
├── package.json
├── vite.config.js
└── README.md
```

---

## App Icon

### Master SVG

Save the following as `showflow-icon.svg` in the project root. This is the single source of truth for all icon sizes.

```svg
<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="iconClip">
      <rect x="0" y="0" width="400" height="400" rx="80"/>
    </clipPath>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e7be8"/>
      <stop offset="100%" style="stop-color:#0832a0"/>
    </linearGradient>
    <linearGradient id="ribbon1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ff5500"/>
      <stop offset="100%" style="stop-color:#ffcc00"/>
    </linearGradient>
    <linearGradient id="ribbon2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#cc0066"/>
      <stop offset="100%" style="stop-color:#ff44cc"/>
    </linearGradient>
    <linearGradient id="ribbon3" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#00a88a"/>
      <stop offset="100%" style="stop-color:#00eedd"/>
    </linearGradient>
    <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a2060"/>
      <stop offset="100%" style="stop-color:#060e30"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#iconClip)">
    <rect x="0" y="0" width="400" height="400" fill="url(#bgGrad)"/>
    <ellipse cx="80" cy="70" rx="160" ry="120" fill="white" opacity="0.07"/>
    <path d="M-20 340 Q120 265 230 305 Q310 332 430 265" fill="none" stroke="url(#ribbon3)" stroke-width="36" stroke-linecap="round"/>
    <path d="M-20 340 Q120 265 230 305 Q310 332 430 265" fill="none" stroke="white" stroke-width="6" stroke-linecap="round" opacity="0.14"/>
    <path d="M-20 285 Q110 200 225 242 Q315 275 430 200" fill="none" stroke="url(#ribbon2)" stroke-width="36" stroke-linecap="round"/>
    <path d="M-20 285 Q110 200 225 242 Q315 275 430 200" fill="none" stroke="white" stroke-width="6" stroke-linecap="round" opacity="0.14"/>
    <path d="M-20 230 Q100 138 220 178 Q315 212 430 135" fill="none" stroke="url(#ribbon1)" stroke-width="36" stroke-linecap="round"/>
    <path d="M-20 230 Q100 138 220 178 Q315 212 430 135" fill="none" stroke="white" stroke-width="6" stroke-linecap="round" opacity="0.18"/>
    <rect x="120" y="58" width="160" height="114" rx="12" fill="url(#screenGrad)" stroke="white" stroke-width="4" opacity="0.97"/>
    <rect x="130" y="68" width="140" height="92" rx="7" fill="#040d28"/>
    <circle cx="200" cy="114" r="24" fill="white" opacity="0.12"/>
    <polygon points="192,103 192,125 216,114" fill="white" opacity="0.92"/>
    <rect x="196" y="172" width="9" height="14" rx="3" fill="white" opacity="0.65"/>
    <rect x="172" y="184" width="56" height="9" rx="4" fill="white" opacity="0.55"/>
    <text x="200" y="382" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="800" fill="white" opacity="0.93" letter-spacing="0.5">ShowFlow</text>
  </g>
</svg>
```

### Icon Generation Script

Create a script `scripts/generate-icons.js` that uses the `sharp` npm package to convert `showflow-icon.svg` into all required PNG sizes. Run it once during setup with `node scripts/generate-icons.js`.

Generate the following sizes and place all files in `public/icons/`:

| Filename | Size | Purpose |
|---|---|---|
| `icon-16.png` | 16×16 | Browser favicon |
| `icon-32.png` | 32×32 | Browser favicon |
| `icon-57.png` | 57×57 | iOS home screen (older) |
| `icon-60.png` | 60×60 | iOS home screen |
| `icon-72.png` | 72×72 | Android |
| `icon-76.png` | 76×76 | iPad home screen |
| `icon-114.png` | 114×114 | iOS retina |
| `icon-120.png` | 120×120 | iOS retina |
| `icon-144.png` | 144×144 | Android / Windows |
| `icon-152.png` | 152×152 | iPad retina |
| `icon-167.png` | 167×167 | iPad Pro |
| `icon-180.png` | 180×180 | iOS primary (required) |
| `icon-192.png` | 192×192 | Android / PWA manifest (required) |
| `icon-512.png` | 512×512 | PWA manifest splash (required) |
| `favicon.ico` | 32×32 | Fallback favicon (save as .ico) |

Also generate a `icon-maskable-512.png` at 512×512 with extra padding (safe zone) for Android adaptive icons — add ~20% padding around the icon content so it renders correctly when masked to a circle or squircle.

Wire all icons into `manifest.json` and all appropriate `<link>` tags in `index.html`.

---

## TVmaze API

**Base URL:** `https://api.tvmaze.com`  
**No API key required. CORS enabled.**

### Endpoints Used

#### Daily Schedule
```
GET /schedule?country=US&date=YYYY-MM-DD
```
Returns all new episode airings in the US for a given date. Key fields per episode:
- `airtime` — local Eastern time string, e.g. `"20:00"`
- `runtime` — duration in minutes
- `name` — episode title
- `season`, `number` — S/E numbers
- `summary` — HTML string with episode synopsis (strip HTML tags before display)
- `show.name` — show title
- `show.network.name` — network name (e.g. `"NBC"`, `"AMC"`)
- `show.genres` — array of strings
- `show.rating.average` — numeric rating or null
- `show.image.medium` — show poster image URL (safe to hotlink)

**Important:** TVmaze's schedule only returns **new airings**. Reruns and filler programming will not appear — handle these as gaps in the data (see Rerun Placeholders below).

#### Search (for the 7-day search feature)
Fetch `/schedule?country=US&date=YYYY-MM-DD` for today + the next 6 days. Cache each day's response separately. Search is performed client-side across all cached days.

### Rate Limiting
- Limit: ~20 requests per 10 seconds on uncached endpoints
- Handle HTTP `429` responses: wait 2 seconds and retry automatically
- Set a descriptive `User-Agent` header on all requests: `ShowFlow-PWA/1.0`

### Timezone Handling
TVmaze returns airtimes in **US Eastern time**. Convert all times to the **user's local timezone** using the browser's `Intl.DateTimeFormat` API or the native `Date` object with timezone offset math. Never display raw Eastern times directly.

---

## Caching Strategy

Use `localStorage` for all API response caching and user preferences.

### Schedule Cache
- Key pattern: `showflow_schedule_YYYY-MM-DD`
- Value: JSON string of the full TVmaze response array for that date
- Cache today + the next 6 days (to support search)
- On app load, fetch today's schedule if not already cached or if the cached entry is older than 1 hour
- **Never show an error screen.** If the network is unavailable, silently fall back to whatever cached data exists for the requested date. Show a subtle "Offline — showing cached data" indicator instead.
- Prune cache entries older than 8 days on each app load to prevent localStorage bloat

### Preferences (persisted indefinitely)
- `showflow_prefs` — JSON object containing:
  - `defaultStartTime` — string, e.g. `"19:00"` (default: `"19:00"` / 7:00 PM)
  - `channelOrder` — array of channel name strings in display order
  - `hiddenChannels` — array of channel name strings the user has hidden
  - `appVersion` — last seen version string

---

## Default Channel List

Pre-populate the channel list with the following. Match against `show.network.name` from TVmaze (case-insensitive, partial match acceptable for common abbreviations):

**Broadcast:**
ABC, NBC, CBS, FOX, PBS, The CW

**Cable:**
AMC, CNN, ESPN, ESPN2, FX, FXX, HBO, MSNBC, Fox News, TNT, TBS, USA Network, Bravo, A&E, Discovery, History, HGTV, Food Network, Hallmark Channel, Lifetime, Comedy Central, Cartoon Network, Disney Channel, Nickelodeon, MTV, VH1, BET, Syfy, truTV, OWN, Animal Planet, National Geographic, TLC, E!

---

## Grid Layout (EPG Style)

### Structure
- **Rows = Channels** (sticky left column showing channel name)
- **Columns = Time slots** (30-minute blocks, scrolling horizontally)
- The channel name column is **sticky/frozen** — it does not scroll horizontally
- The time header row is **sticky/frozen** — it does not scroll vertically
- Show blocks span multiple columns proportionally based on `runtime` (e.g. a 60-minute show spans 2 columns)
- The grid always displays a **minimum of 6 hours** of programming at a time
- Both axes scroll independently of their frozen headers

### Show Blocks (new airings)
Each colored block displays:
- **Show name** (bold, truncated with ellipsis)
- **Episode name** (smaller, truncated)
- **"S2 E4"** season/episode badge
- **"NEW" pill badge** — small, accent colored
- Clicking a block opens the Show Modal

Color-code blocks by a hash of the show name so the same show always gets the same color across days and channels. Use a palette of 6–8 distinct, accessible colors.

### Rerun Placeholders
For any 30-minute timeslot on a channel that has no TVmaze data, render a **gray placeholder block** labeled "Rerun" in muted text. These blocks:
- Fill the gap so the grid looks complete
- Are **non-interactive** (no click, no cursor pointer, no hover state)
- Are visually subdued — lighter gray, no border, no badge

### Now Line
A vertical line indicating the current time:
- Updates every minute
- Visually distinct (e.g. a bright accent color, 2px wide)
- A small label at the top showing the current time (e.g. "8:47 PM")
- The "What's on Now" button in the toolbar scrolls the grid horizontally to bring this line into view, centering it on screen

---

## Toolbar / Header

Place a fixed top toolbar containing:

1. **ShowFlow logo/wordmark** — left side
2. **Date picker** — segmented control or dropdown showing: Yesterday, Today (default), Tomorrow, + 4 more days (7 days total)
3. **Start time picker** — dropdown with 30-minute increments from 6:00 AM to 2:00 AM. Defaults to the value stored in preferences (`19:00` / 7:00 PM on first launch). Changing this scrolls the grid to that time and saves the preference.
4. **"Now" button** — scrolls grid to current time and shows the Now Line
5. **Search icon** — opens the Search Panel overlay
6. **Settings icon (⚙)** — opens the Settings Panel

---

## Show Modal

Triggered by clicking any colored show block. Display as a centered modal overlay with:

- Show poster image (from `show.image.medium`) — if null, show a placeholder
- Show name (large heading)
- Network name + genre tags
- Air time + runtime (in user's local timezone)
- Season & episode number: "Season 2, Episode 4"
- Episode title
- Synopsis (strip HTML tags from `summary`, show "No synopsis available" if null)
- Star rating (from `show.rating.average`) — display as stars or numeric
- Close button (X) and click-outside-to-dismiss

---

## Search Panel

Opens as a full-width overlay or side drawer.

- Text input, auto-focused on open
- Searches across today + the next 6 days of cached schedule data
- Matches against show name, episode name, and network name
- Results grouped by date, then sorted by air time within each date
- Each result shows: show name, episode name, network, date, local air time
- Clicking a result closes the panel and navigates the main grid to that date and time
- If data for a future date isn't cached yet, fetch it on demand (with loading indicator)
- Show "No results found" state if search returns empty

---

## Settings Panel

Opens as a slide-in drawer or modal. Sections:

### Channel Management
- List of all channels in current order
- Toggle switch on each channel to show/hide it in the grid
- **Drag-and-drop reordering** using SortableJS (load from CDN or install as dependency)
- "Reset to default order" button — restores original channel list and order
- All changes save to `localStorage` immediately on interaction

### Preferences
- **Default start time** — same dropdown as the toolbar. Changing it here updates the persistent default.
- **Export preferences** — "Download preferences CSV" button that triggers a file download of a `.csv` file containing: channel order, hidden channels, and default start time. Format should be human-readable and re-importable.
- **Import preferences** — file input accepting `.csv` files exported by ShowFlow. On import, validate the format, apply the preferences, and refresh the grid.

### About
- App name: ShowFlow
- Version number (e.g. `v1.0.0`) — must match the version string in the service worker
- Data source credit: "TV schedule data provided by TVmaze"
- **"Check for Updates" button** — calls `registration.update()` on the active service worker. If a new version is found and waiting, call `skipWaiting()` and reload the page. Show feedback: "You're on the latest version" or "Update found — reloading…"

---

## PWA Requirements

### Web App Manifest (`public/manifest.json`)
```json
{
  "name": "ShowFlow",
  "short_name": "ShowFlow",
  "description": "Your personal TV listings guide",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0832a0",
  "theme_color": "#1e7be8",
  "orientation": "any",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### Service Worker (`public/sw.js`)
- **Cache name must include the version string**, e.g. `showflow-v1.0.0`
- On install: precache all static assets (HTML, CSS, JS, icons, manifest)
- On fetch:
  - Static assets → cache-first strategy
  - TVmaze API calls → network-first, fall back to `localStorage` cache (the service worker doesn't need to cache API responses itself — that's handled in-app via `localStorage`)
- On activate: delete old cache versions (any cache name not matching current version)
- Export a `VERSION` constant at the top of `sw.js` — this is the single source of truth for the app version. The app reads this and displays it in the Settings panel.

### Install Banner (`InstallBanner` component)
- Intercept the `beforeinstallprompt` event and store it
- Show a dismissible banner at the top or bottom of the screen when:
  - The event has fired (Chrome/Edge/Android)
  - The app is not already running in standalone mode (`window.matchMedia('(display-mode: standalone)').matches`)
- Banner text: "Install ShowFlow for the best experience"
- Two buttons: "Install" (triggers the stored prompt) and "Not now" (dismisses and remembers in `sessionStorage`)
- **iOS Safari fallback:** iOS does not fire `beforeinstallprompt`. Detect iOS + Safari + not-standalone and instead show a different banner with manual instructions: "Tap the Share button (↑) then 'Add to Home Screen'"
- The banner must not reappear after the user has installed or dismissed it

### Version Display & Update Flow
1. The version string (e.g. `"1.0.0"`) is defined as a constant in `sw.js`
2. On app load, the app reads this version from the active service worker and displays it in Settings → About as `v1.0.0`
3. The "Check for Updates" button in Settings:
   - Calls `registration.update()` 
   - If a new service worker is found waiting: show "Update found — reloading in 3s…", call `skipWaiting()`, then `window.location.reload()`
   - If no update: show "You're on the latest version (v1.0.0)"

---

## Export / Import Preferences (CSV Format)

### Export
Generate a `.csv` file with the following structure:

```
setting,value
version,1.0
defaultStartTime,19:00
hiddenChannels,"ESPN2,FXX,VH1"
channelOrder,"ABC,NBC,CBS,FOX,AMC,CNN,ESPN,FX,HBO,MSNBC,..."
```

Trigger download via a `<a>` element with `href` set to a `Blob` URL and `download="showflow-preferences.csv"`.

### Import
- Accept `.csv` files via a file input
- Parse and validate the format — show a user-friendly error if the file is invalid
- Apply parsed values to `localStorage` and reload the grid state
- Show a success confirmation: "Preferences imported successfully"

---

## Offline / Error Handling

- **Never show a browser error or blank screen.** The app must always render something.
- If no cached data exists for the selected date and the network is unavailable: show a friendly message in the grid area: "No data available for this date. Connect to the internet to load the schedule."
- If the TVmaze API returns an error: show a dismissible banner "Couldn't load schedule — showing cached data" and fall back gracefully
- All API calls must have a timeout of 10 seconds

---

## GitHub Pages Deployment

- Configure `vite.config.js` with the correct `base` path for GitHub Pages (e.g. `base: '/showflow/'` if the repo is named `showflow`)
- Add a `deploy` script to `package.json` using `gh-pages` package: `"deploy": "vite build && gh-pages -d dist"`
- Include a `404.html` that redirects to `index.html` for client-side routing support on GitHub Pages
- Add a `.nojekyll` file to the `dist` folder during build to prevent GitHub Pages from ignoring files starting with `_`
- Document the full deployment steps in `README.md`

---

## Visual Design Guidelines

- **Color palette:** Use the ShowFlow brand colors from the icon — deep blue (`#0832a0`), medium blue (`#1e7be8`) as primary UI colors. Accent with orange (`#ff5500`), magenta (`#cc0066`), and teal (`#00a88a`) for show blocks and highlights.
- **Typography:** System font stack — clean, readable at small sizes
- **Dark mode:** Support `prefers-color-scheme: dark` — the EPG grid particularly benefits from a dark theme
- **Mobile responsive:** The grid should work on both desktop and mobile. On mobile, consider making channel labels narrower and time slots slightly wider for touch usability.
- **Accessibility:** All interactive elements must be keyboard accessible. Show blocks must have `aria-label` with show name and air time. Modal must trap focus and be dismissible with Escape key.

---

## Key Technical Notes

- **SortableJS** for drag-and-drop: install via npm or load from `https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js`
- **Strip HTML from TVmaze summaries** before displaying — use `DOMParser` or a simple regex: `text.replace(/<[^>]*>/g, '')`
- **Timezone conversion:** `airtime` from TVmaze is Eastern time. Use `Intl.DateTimeFormat` with `timeZone: 'America/New_York'` to parse, then convert to local using the `Date` object
- **Show block width calculation:** `width = (runtime / 30) * slotWidth`. A 30-min show = 1 slot. A 60-min show = 2 slots. A 90-min show = 3 slots.
- **Rerun gap detection:** For each channel row, iterate through all 30-min slots in the displayed time range. Any slot with no TVmaze episode = render a `RerunBlock`
- **localStorage quota:** Be mindful of the ~5MB localStorage limit. The rolling 8-day cache + preferences should stay well within this, but add error handling around `localStorage.setItem` to catch `QuotaExceededError`

---

## Version

Start at `v1.0.0`. The version string must appear in exactly two places:
1. As `const VERSION = '1.0.0'` at the top of `sw.js`
2. Displayed in the Settings → About section, read from the active service worker at runtime

Do not hardcode it anywhere else — always reference the service worker constant.
