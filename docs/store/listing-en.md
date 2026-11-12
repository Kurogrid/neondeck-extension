# Chrome Web Store listing: English

> Draft by [claude], 2026-11-12. Lines marked **(after Faz 2)** describe [antigravity]'s visual work; check them against the final build before submitting.

## Name
NEONDECK

## Short description (max 132 characters)
A cyberpunk HUD new tab dashboard: themes, live backgrounds, netlinks and focus widgets.

_(88 characters; same text as `extDescription` in `_locales/en/messages.json`.)_

## Category
Productivity → Tools _(or "Workflow & Planning" if offered)_

## Language
English, Turkish

## Detailed description

Turn every new tab into a neon command deck.

NEONDECK replaces Chrome's new tab page with a fast, private dashboard styled like a cyberpunk HUD. Everything runs locally: no account, no tracking, no ads.

**COMMAND DECK**
• Greeting, big clock and date (12/24-hour)
• Search bar with your choice of engine: Google, DuckDuckGo, Bing, Brave, ChatGPT, Perplexity, YouTube, or add your own
• Press / to search, 1–9 to open your top links

**NETLINKS**
• Your favourite sites as cards, grouped into collapsible categories
• Built-in icons or the site's own favicon (optional permission)
• Import your browser bookmarks in one click (optional permission)

**WIDGETS**, in a side panel you arrange by drag and drop:
• Weather (Open-Meteo, °C/°F, works offline with the last data)
• World clock with any time zone
• Scratchpad with multiple notes
• Tasks and daily habits with streaks
• Pomodoro focus timer that survives closing the tab
• AI quick access: Claude, Gemini, ChatGPT or your own links

**LOOK & FEEL**
• Four themes: Neon Pulse, Red Protocol, Phantom Signal, Acid Orchid
• Corner-cut panels, scanlines and glitch accents, low-power mode and reduced-motion support **(after Faz 2: confirm effects)**
• Live animated backgrounds **(after Faz 2)**

**PRIVATE BY DESIGN**
• Installs with storage permission only; extra permissions are asked only when you click
• Settings stay on your device; export and import them as a JSON file
• No remote code, strict content security policy

English and Turkish interface.

NEONDECK is an independent project and is not affiliated with any game, film or brand.

## Single purpose (dashboard field)
NEONDECK replaces the new tab page with a personal dashboard (clock, search box, saved links and small productivity widgets). It does not change the default search engine or any other browser setting.

## Permission justifications (dashboard fields)
- **storage**: saves the user's settings, links and widget content locally on the device.
- **favicon** (optional): shows website icons for saved links from Chrome's local favicon cache, only after the user enables it.
- **bookmarks** (optional): reads bookmarks once, when the user clicks "Import bookmarks", to copy them into saved links on the device.
- **Remote code**: No. All code is in the package.

## Data usage (Privacy practices tab)
Suggested answers (the decision is the publisher's):
- **Location**: declare "approximate location" as handled: only when the user enables the Weather widget, the chosen city's rounded coordinates go to Open-Meteo to get the forecast. It is not sent to the developer, not sold, not used for anything else.
- All other data types: not collected.
- Certify: not sold to third parties; not used for purposes unrelated to the single purpose; not used for creditworthiness or lending.

## Privacy policy URL
https://kurogrid.github.io/neondeck/privacy (source: public repo `Kurogrid/kurogrid.github.io`; keep it in sync with `docs/store/privacy-policy.md`).
