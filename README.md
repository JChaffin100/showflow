# ShowFlow

A personal TV listings Progressive Web App (PWA) powered by the free [TVmaze](https://www.tvmaze.com) public API. Browse your favourite channels in an EPG-style grid, search across the next 7 days, and install it to your home screen for a native app experience.

---

## Features

- **EPG grid** — channels as rows, 30-minute time slots as columns, scrolls independently on both axes with sticky channel labels and a sticky time header
- **New episode blocks** — colour-coded by show, with show name, episode title, season/episode badge, and a NEW pill
- **Rerun placeholders** — grey blocks fill any timeslot with no TVmaze data so the grid always looks complete
- **Now line** — a live vertical indicator of the current time that updates every minute; the Now button in the toolbar scrolls it into view
- **Show modal** — click any show block for full episode details: poster, synopsis, network, genres, air time (local timezone), season/episode, and star rating
- **Search** — full-text search across today + the next 6 days of schedule data, grouped by date and sorted by air time
- **7-day date picker** — browse Yesterday, Today, Tomorrow, and 4 days ahead
- **Start time picker** — 30-minute increments from 6:00 AM to 2:00 AM; defaults to 7:00 PM and persists across sessions
- **Settings panel** — drag-to-reorder channels (SortableJS), show/hide individual channels, default start time, theme selector, CSV export/import, and an update checker
- **Light / Dark / System theme** — fully themed with CSS variables; respects `prefers-color-scheme` in System mode
- **Offline support** — the service worker caches all static assets; API responses are cached in `localStorage` for up to 8 days; the app always renders something gracefully
- **PWA install** — Chrome/Edge/Android install prompt; iOS Safari "Add to Home Screen" instruction fallback
- **GitHub Pages ready** — pre-configured `base` path and deploy script

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Drag-and-drop | SortableJS |
| Icon generation | sharp (dev only) |
| Deployment | gh-pages |
| API | TVmaze public API (no key required) |
| Storage | localStorage only — no backend |

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Install

```bash
git clone https://github.com/YOUR_USERNAME/showflow.git
cd showflow
npm install
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:5173/showflow/](http://localhost:5173/showflow/) in your browser.

### Build for production

```bash
npm run build
```

Output is placed in the `dist/` folder.

### Preview the production build

```bash
npm run preview
```

---

## Deployment (GitHub Pages)

ShowFlow is pre-configured to deploy to GitHub Pages from the `dist/` folder.

### One-time setup

1. Create a GitHub repository named `showflow` (or update `base` in `vite.config.js` to match your repo name).
2. In your repository settings, go to **Settings → Pages** and set the source to the `gh-pages` branch.

### Deploy

```bash
npm run deploy
```

This runs `vite build` and then publishes the `dist/` folder to the `gh-pages` branch automatically.

Your app will be live at:
```
https://YOUR_USERNAME.github.io/showflow/
```

> **Note:** The `404.html` file in `public/` handles client-side routing redirects on GitHub Pages. The `.nojekyll` file prevents GitHub Pages from ignoring Vite's underscore-prefixed asset files.

---

## Project Structure

```
showflow/
├── public/
│   ├── icons/               All PWA icon sizes (generated from SVG)
│   ├── manifest.json        Web App Manifest
│   ├── sw.js                Service worker (source of truth for VERSION)
│   ├── 404.html             GitHub Pages SPA redirect
│   └── .nojekyll            Bypasses Jekyll on GitHub Pages
├── scripts/
│   └── generate-icons.js    Icon generation script (uses sharp)
├── src/
│   ├── components/
│   │   ├── Grid.jsx         Main EPG grid
│   │   ├── ChannelCell.jsx  Sticky left channel label
│   │   ├── ShowBlock.jsx    Clickable episode block
│   │   ├── RerunBlock.jsx   Grey placeholder for unlisted timeslots
│   │   ├── ShowModal.jsx    Episode detail modal
│   │   ├── SearchPanel.jsx  7-day search overlay
│   │   ├── SettingsPanel.jsx Channel management + preferences
│   │   ├── TimeHeader.jsx   Scrolling time column headers
│   │   ├── NowLine.jsx      Live current-time indicator
│   │   └── InstallBanner.jsx PWA install prompt
│   ├── hooks/
│   │   ├── useSchedule.js   TVmaze API fetching + localStorage caching
│   │   └── usePreferences.js localStorage preferences read/write
│   ├── utils/
│   │   ├── timeUtils.js     Timezone conversion, slot math, time formatting
│   │   └── channelUtils.js  Default channel list, network matching, colour hashing
│   ├── App.jsx              Root component — toolbar, layout, state wiring
│   ├── main.jsx             React entry point
│   └── index.css            Full stylesheet (light + dark themes)
├── showflow_icon_v4.svg     Master icon SVG (source for all PNG sizes)
├── vite.config.js
└── package.json
```

---

## Regenerating Icons

If you update `showflow_icon_v4.svg`, regenerate all PNG icon sizes with:

```bash
npm run generate-icons
```

This uses the `sharp` package to produce 15 PNG sizes plus a maskable 512×512 variant into `public/icons/`.

---

## Configuration

### Changing the GitHub Pages base path

If your repository is not named `showflow`, update the `base` option in `vite.config.js`:

```js
export default defineConfig({
  base: '/your-repo-name/',
  // ...
})
```

Also update the corresponding paths in `public/sw.js`, `public/manifest.json`, and `index.html`.

### Versioning

The app version is defined in exactly one place:

```js
// public/sw.js
const VERSION = '1.0.0';
```

The Settings → About panel reads this value from the active service worker at runtime. Do not hardcode the version anywhere else.

---

## Data & Caching

- Schedule data is fetched from the [TVmaze API](https://www.tvmaze.com/api) — no API key required
- Each day's schedule is cached in `localStorage` under the key `showflow_schedule_YYYY-MM-DD`
- Cache entries are considered fresh for **1 hour**, then re-fetched on next load
- Entries older than **8 days** are pruned automatically on app load
- If the network is unavailable, the app falls back to whatever is in the cache and shows a subtle offline indicator
- User preferences are stored in `localStorage` under `showflow_prefs`

---

## Preferences CSV Format

Preferences can be exported and imported via **Settings → Data**.

```
setting,value
version,1.0
defaultStartTime,19:00
hiddenChannels,"ESPN2,FXX,VH1"
channelOrder,"ABC,NBC,CBS,FOX,AMC,CNN,ESPN,FX,HBO,..."
```

---

## Keyboard Accessibility

- All show blocks are focusable and activatable with `Enter` or `Space`
- The show modal traps focus and dismisses with `Escape`
- The search and settings panels dismiss with `Escape`
- All interactive controls have visible focus indicators

---

## Browser Support

| Browser | Support |
|---|---|
| Chrome / Edge (desktop + Android) | Full PWA install + all features |
| Firefox | Full features, no install prompt |
| Safari (macOS) | Full features, no install prompt |
| Safari (iOS) | Full features + "Add to Home Screen" install instructions |

---

## Credits

- TV schedule data provided by [TVmaze](https://www.tvmaze.com) — free public API, no key required
- Drag-and-drop channel reordering by [SortableJS](https://sortablejs.github.io/Sortable/)
- Icons generated with [sharp](https://sharp.pixelplumbing.com/)

---

## License

MIT
