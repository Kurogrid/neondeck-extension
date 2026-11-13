# Firefox Add-ons (addons.mozilla.org) submission: NEONDECK 0.1.0 alpha

> Prepared 2026-11-12. Copy each block into the matching field of the AMO Developer Hub.

## Files to upload
- **Add-on file**: `release/neondeck-0.1.0-firefox.zip`
- **Source code** (asked because the code is bundled/minified by Vite): `release/neondeck-0.1.0-source.zip`
- Both come from `npm run package` on a clean, committed tree.

## Distribution
- **On this site** (listed on addons.mozilla.org).
- Tick **"This add-on is experimental"**: marks 0.1.0 as alpha on the listing page.
- Platform: Firefox (desktop). Android is not declared (`gecko_android` absent).

## Name
NEONDECK

## Add-on URL (slug)
neondeck

## Summary (max 250 characters)
Alpha. A cyberpunk HUD new tab: big clock, multi-engine search, netlinks with categories and 1–9 shortcuts, and side-panel widgets (weather, world clock, notes, tasks & habits, Pomodoro, AI links). Private by design: no account, no tracking.

## Description
NEONDECK turns every new tab into a neon command deck. This is an early alpha: the core works, the full visual identity (animated backgrounds, CRT and glitch effects, final icon set, ambient sound) is still being built.

COMMAND DECK
• Greeting, big clock and date (12/24-hour)
• Search with Google, DuckDuckGo, Bing, Brave, ChatGPT, Perplexity, YouTube or your own engine
• Press / to search, 1–9 to open your top links

NETLINKS
• Your favourite sites as cards in collapsible categories
• Import your Firefox bookmarks in one click (optional permission)

WIDGETS (side panel, drag to reorder)
• Weather (Open-Meteo, °C/°F; asks for your location-data consent first)
• World clock with any time zone
• Scratchpad with multiple notes
• Tasks and daily habits with streaks
• Pomodoro timer that keeps going after you close the tab
• AI quick access: Claude, Gemini, ChatGPT or your own links

LOOK
• Four themes: Neon Pulse, Red Protocol, Phantom Signal, Acid Orchid

PRIVATE BY DESIGN
• Installs with storage permission only
• Settings stay on your device; export/import as JSON
• No remote code, strict content security policy

English and Turkish interface. NEONDECK is an independent project, not affiliated with any game, film or brand.

## Categories
Firefox: **Tabs**, **Appearance** (pick what the form offers; max 2–3).

## Tags
new tab, dashboard, productivity, cyberpunk, widgets

## Support email
kurogrid.dev@gmail.com

## Homepage
https://kurogrid.github.io/

## License
All Rights Reserved (default) unless the owner chooses an open-source license.

## Privacy policy (AMO has a text field)
Paste the text of `docs/store/privacy-policy.md` (also online at https://kurogrid.github.io/neondeck/privacy).

## Release notes (version 0.1.0)
First public alpha. Command deck (clock, search, quote), netlinks with categories and keyboard shortcuts, settings with JSON backup/import, four colour themes, widget panel with weather, world clock, scratchpad, tasks & habits, Pomodoro and AI links. Visual effects, animated backgrounds and sound come in later versions.

## Notes for reviewers
- Build: see BUILD.md in the source zip. `npm ci && npm run build:firefox` produces `dist-firefox/`, identical to the uploaded package. Built on Windows 11 with Node 24.20.0 / npm 11.19.0; only public npm packages.
- Bundler: Vite (open source). Runtime library: Preact (MIT, https://github.com/preactjs/preact), bundled from npm.
- The linter warning `UNSAFE_VAR_ASSIGNMENT` (innerHTML) comes from Preact's internal `dangerouslySetInnerHTML` support. NEONDECK's own code never uses innerHTML or `dangerouslySetInnerHTML`.
- Network: only `api.open-meteo.com` and `geocoding-api.open-meteo.com` (weather), restricted by CSP `connect-src`. Requests are made only after the user opts in to the optional `locationInfo` data collection permission (built-in consent, `strict_min_version` 140).
- Permissions: `storage`; optional `bookmarks`, requested only from the "Import bookmarks" button.
- No remote code, no content scripts, no background script.
