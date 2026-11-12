# NEONDECK

A cyberpunk HUD new tab dashboard for Firefox and Chrome: big clock, multi-engine search, netlinks with keyboard shortcuts, and a side panel of focus widgets. Private by design: no account, no tracking, no remote code.

> **Status: 0.1.0 alpha.** The core works. The full visual identity (animated backgrounds, CRT and glitch effects, final icon set, ambient sound) is still being built.

_Türkçe özet aşağıda._

## Features
- **Command deck**: greeting, clock and date (12/24-hour), search with Google, DuckDuckGo, Bing, Brave, ChatGPT, Perplexity, YouTube or your own engine. `/` focuses search, `1`–`9` open your top links.
- **Netlinks**: saved sites as cards in collapsible categories; import browser bookmarks (optional permission).
- **Widgets** (side panel, drag to reorder): weather (Open-Meteo), world clock, scratchpad, tasks and habits with streaks, Pomodoro, AI quick links.
- **Themes**: Neon Pulse, Red Protocol, Phantom Signal, Acid Orchid.
- **Data**: everything stays in local extension storage; JSON export/import (also imports exports from the Cyberstart extension).
- **Languages**: English, Turkish.

## Install
- **Firefox**: on addons.mozilla.org (listing pending review).
- **From source**: build it (below), then
  - Firefox: `about:debugging` → This Firefox → Load Temporary Add-on → `dist-firefox/manifest.json`
  - Chrome: `chrome://extensions` → Developer mode → Load unpacked → `dist/`

## Build
Requires Node.js 24 and npm 11.

```bash
npm ci
npm run verify          # type-check, tests, Chrome build, manifest checks
npm run build:firefox   # Firefox build in dist-firefox/
npm run package         # release zips in release/ (needs a clean git tree)
```

Details for reproducible builds: [BUILD.md](BUILD.md).

## Privacy
NEONDECK installs with the `storage` permission only. The weather widget sends the chosen city and rounded coordinates to Open-Meteo, only after you opt in (Firefox asks for location-data consent). Nothing is sent to the developer. Full policy: https://kurogrid.github.io/neondeck/privacy

## Project layout
- `src/core/`: storage, schema and migrations, validation, permissions, i18n
- `src/widgets/`: widget logic (pure, tested) and views
- `src/components/`: UI components (Preact)
- `public/`: manifest, locales, icons
- `scripts/`: Firefox build, packaging, manifest checks

## License
[MIT](LICENSE) © 2026 Kurogrid. Third-party notices: [LICENSES.md](LICENSES.md).

NEONDECK is an independent project and is not affiliated with any game, film or brand.

---

## Türkçe özet
NEONDECK, Firefox ve Chrome için cyberpunk HUD tarzı bir yeni sekme panosudur: büyük saat, çoklu arama motoru, kısayollu netlink'ler ve yan panelde odak widget'ları (hava durumu, dünya saati, not defteri, görev ve alışkanlıklar, Pomodoro, AI bağlantıları). Hesap yok, izleme yok; veriler tarayıcında kalır. Şu an **0.1.0 alfa** sürümündedir; görsel kimlik (canlı arka planlar, efektler, ikonlar, ses) geliştiriliyor. Derleme adımları yukarıda, lisans MIT.
