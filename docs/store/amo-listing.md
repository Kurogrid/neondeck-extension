# Firefox Add-ons (addons.mozilla.org): NEONDECK 0.2.0

> Prepared 2026-11-22. 0.1.0 has been live since 2026-11-15 (https://addons.mozilla.org/firefox/addon/neondeck/). For 0.2.0 use **Upload New Version**, then update the listing fields below via **Edit Product Page**.

## Files to upload (Upload New Version)
- **Add-on file**: `release/neondeck-0.2.0-firefox.zip`
- **Source code** (Vite bundles/minifies the code): `release/neondeck-0.2.0-source.zip`
- Both come from `npm run package` on a clean, committed tree.
- Compatibility: Firefox (desktop) only.

## Screenshots (Edit Product Page → Images)
`docs/store/screenshots/` (all 1280x800), in this order:
1. `01-edgerunners.png`: Edgerunners theme with weather and Pomodoro
2. `02-arasaka.png`: Arasaka theme
3. `03-ghost.png`: Ghost theme
4. `04-orchid.png`: Acid Orchid theme
5. `05-widgets.png`: widget panel (tasks and habits, ambient sound, AI quick access)

Suggested captions:
1. Edgerunners: neon rain city, live weather and a Pomodoro dial
2. Arasaka: red corporate HUD with a live radar background
3. Ghost: signal rain and circuit traces
4. Acid Orchid: synth horizon and neon grid
5. Widgets you arrange by drag and drop: tasks, habits, ambient sound, AI links

## Distribution
- Keep **"This add-on is experimental"** ticked (still alpha).

## Summary (max 250 characters)
Alpha. A cyberpunk HUD new tab with four animated themes (Edgerunners, Arasaka, Ghost, Acid Orchid), CRT and glitch effects, multi-engine search, netlinks and a widget panel: weather, Pomodoro, tasks, ambient sound. No account, no tracking.

_(240 characters)_

## Description
NEONDECK turns every new tab into a neon command deck. Still an alpha, but the full look is here: four themes, each with its own animated background, HUD frames and optional CRT and glitch effects.

THEMES
• Edgerunners: neon rain city at night
• Arasaka: red corporate HUD with a sweeping radar
• Ghost: green signal rain and circuit traces
• Acid Orchid: purple synth horizon over a neon grid
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
• Ambient sound: night rain or synth pad, generated in your browser, never autoplays
• AI quick access: Claude, Gemini, ChatGPT or your own links

PRIVATE BY DESIGN
• Installs with storage permission only
• Settings stay on your device; export/import as JSON
• No remote code, no sound or font downloads, strict content security policy

English and Turkish interface. Open source (MIT): https://github.com/Kurogrid/neondeck-extension

NEONDECK is an independent fan-made project. It is not affiliated with, endorsed by or sponsored by CD PROJEKT, Netflix or any other rights holder; theme names refer to the moods they evoke.

## Release notes (version 0.2.0)
The visual update. Four themes now have their own animated canvas backgrounds (neon rain city, red radar HUD, signal rain, synth grid), HUD frames, CRT scanlines, glitch and vignette effects. New settings drawer with theme cards and toggles, 40+ new netlink icons, a Pomodoro dial, and an ambient sound widget (rain / synth pad, synthesized locally, never autoplays) plus optional UI sounds. Theme ids are migrated automatically; your settings are kept.

## Notes for reviewers (0.2.0)
- Build: see BUILD.md in the source zip. `npm ci && npm run build:firefox` produces `dist-firefox/`, identical to the uploaded package (verified locally). Built on Windows 11 with Node 24.20.0 / npm 11.19.0; only public npm packages.
- Bundler: Vite (open source). Runtime library: Preact (MIT, https://github.com/preactjs/preact), bundled from npm.
- The linter warning `UNSAFE_VAR_ASSIGNMENT` (innerHTML) comes from Preact's internal `dangerouslySetInnerHTML` support. NEONDECK's own code never uses innerHTML or `dangerouslySetInnerHTML`.
- New in 0.2.0: 2D canvas backgrounds (`src/scenes/`), paused when the tab is hidden and static in low-power / reduced-motion mode; WebAudio sounds (`src/audio/`) synthesized procedurally, no audio files, started only from a user click.
- Network: unchanged. Only `api.open-meteo.com` and `geocoding-api.open-meteo.com` (weather), restricted by CSP `connect-src`, and only after the user opts in to the optional `locationInfo` data collection permission.
- Permissions: unchanged. `storage`; optional `bookmarks`, requested only from the "Import bookmarks" button. No remote code, no content scripts, no background script.

## Unchanged fields
Name `NEONDECK`, slug `neondeck`, categories Tabs + Appearance, support email kurogrid.dev@gmail.com, homepage https://kurogrid.github.io/, license MIT, privacy policy (text of `docs/store/privacy-policy.md`, online at https://kurogrid.github.io/neondeck/privacy).
