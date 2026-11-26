# Firefox Add-ons (addons.mozilla.org): NEONDECK 1.0.0

> Prepared 2026-11-23. 0.2.0 is live (https://addons.mozilla.org/firefox/addon/neondeck/). For 1.0.0 use **Upload New Version**, then update the listing fields below via **Edit Product Page**.

## Files to upload (Upload New Version)
- **Add-on file**: `release/neondeck-1.0.0-firefox.zip`
- **Source code** (Vite bundles/minifies the code): `release/neondeck-1.0.0-source.zip`
- Both come from `npm run package` on a clean, committed tree.
- Compatibility: Firefox (desktop) only.

## Screenshots (Edit Product Page → Images)
`docs/store/screenshots/` (all 1280x800, captured from the dev server with English UI), in this order, with captions:
1. `01-edgerunners.png`: Edgerunners: neon rooftop wallpaper, live weather and a Pomodoro dial
2. `02-arasaka.png`: Arasaka: red corporate HUD with a sweeping radar, world clock, tasks and habit streaks
3. `03-samurai.png`: Samurai: rain-soaked overpass at night, with a music track for every theme
4. `04-ghost.png`: Ghost: green cyberspace with scratchpad notes and Pomodoro
5. `05-orchid.png`: Acid Orchid: synth horizon, weather and world clock
6. `06-settings.png`: Settings: five themes, live wallpapers or upload your own
7. `07-widgets.png`: Widgets you arrange by drag and drop: tasks, habits, AI links and more

No radio screenshot: the Spotify embed shows third-party album art.

## Distribution
- Untick **"This add-on is experimental"** (1.0.0 is the first stable release).

## Summary (max 250 characters)
A cyberpunk HUD new tab with five themes, live wallpapers, CRT and glitch effects, theme music, multi-engine search, netlinks and a widget panel: weather, Pomodoro, tasks, ambient sound. No account, no tracking.

## Description
NEONDECK turns every new tab into a neon command deck: five themes with live wallpapers or animated backgrounds, HUD frames and optional CRT and glitch effects.

THEMES
• Edgerunners: neon rain city at night
• Arasaka: red corporate HUD with a sweeping radar and a "Security Login" search panel
• Ghost: green signal rain and circuit traces
• Acid Orchid: purple synth horizon over a neon grid
• Samurai: red and cyan stage lights
• Upload your own wallpaper (stored only in your browser)
• Scanlines, glitch, vignette and corner-cut panels you can tune or turn off
• Low power mode and reduced-motion support: animations stop completely

COMMAND DECK
• Greeting, big clock and date (12/24-hour)
• Search with Google, DuckDuckGo, Bing, Brave, ChatGPT, Perplexity, YouTube or your own engine
• Press / to search, 1–9 to open your top links

NETLINKS
• Your favourite sites as cards in collapsible categories, with 40+ HUD icons
• Import your Firefox bookmarks in one click (optional permission)

WIDGETS (side panel, drag to reorder)
• Weather (Open-Meteo, °C/°F; asks for your location-data consent first)
• World clock with any time zone
• Scratchpad with multiple notes
• Tasks and daily habits with streaks
• Pomodoro with a neon dial; keeps going after you close the tab
• Ambient sound: rain, synth pad and a track for each theme, generated in your browser, never autoplays
• Local music player: add your own audio files; they stay in your browser
• AI quick access: Claude, Gemini, ChatGPT or your own links

PRIVATE BY DESIGN
• Installs with storage permission only
• Settings stay on your device; export/import as JSON
• No remote code, no sound or font downloads, strict content security policy
• Optional Spotify radio loads only when you open it

English and Turkish interface. Open source (MIT): https://github.com/Kurogrid/neondeck-extension

NEONDECK is an independent fan-made project. It is not affiliated with, endorsed by or sponsored by CD PROJEKT, Netflix or any other rights holder; theme names refer to the moods they evoke.

## Release notes (version 1.1.0)
Arasaka theme: a corporate "Security Login" search panel with an original gate emblem, and a corporate banner when the search bar is hidden. Under the hood: accessibility fixes (screen readers no longer read the greeting and clock three times) and new automated checks for accessibility, content security policy and performance. Your settings are kept.

## Release notes (version 1.0.0)
First stable release. New Samurai theme; live wallpapers with animated HUD overlays and your own wallpaper upload; a music track for every theme (synthesized locally); a local music player for your own files; an optional Spotify radio that loads only when you open it; close buttons on dialogs and visual polish across all themes. Your settings are kept.

## Notes for reviewers (1.1.0)
- 1.1.0 changes UI code only (Arasaka search panel and banner, drawn as inline SVG from original paths; a CSS accessibility fix). No new permissions, hosts or libraries. Build steps unchanged.

## Notes for reviewers (1.0.0)
- Build: see BUILD.md in the source zip. `npm ci && npm run build:firefox` produces `dist-firefox/`, identical to the uploaded package (verified locally). Built on Windows 11 with Node 24.20.0 / npm 11.19.0; only public npm packages.
- Bundler: Vite (open source). Runtime library: Preact (MIT, https://github.com/preactjs/preact), bundled from npm.
- The linter warning `UNSAFE_VAR_ASSIGNMENT` (innerHTML) comes from Preact's internal `dangerouslySetInnerHTML` support. NEONDECK's own code never uses innerHTML or `dangerouslySetInnerHTML`.
- New in 1.0.0: wallpapers are bundled WebP images (`public/wallpapers/`), all original. Theme music is synthesized with WebAudio (`src/audio/`), no audio files. User-added music and wallpapers are stored only in IndexedDB.
- Spotify radio (`src/components/RadioDeck.tsx`): an `https://open.spotify.com/embed/...` iframe, allowed by CSP `frame-src https://open.spotify.com` only. It is created only after the user opens the radio panel or tab; the extension does not exchange data with it. Described in the privacy policy.
- Network: weather only, `api.open-meteo.com` and `geocoding-api.open-meteo.com`, restricted by CSP `connect-src`, and only after the user opts in to the optional `locationInfo` data collection permission.
- Permissions: unchanged. `storage`; optional `bookmarks`, requested only from the "Import bookmarks" button. No remote code, no content scripts, no background script.

## Unchanged fields
Name `NEONDECK`, slug `neondeck`, categories Tabs + Appearance, support email kurogrid.dev@gmail.com, homepage https://kurogrid.github.io/, license MIT, privacy policy (text of `docs/store/privacy-policy.md`, online at https://kurogrid.github.io/neondeck/privacy).
