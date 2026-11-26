# Building NEONDECK from source

Instructions for reproducing the packaged extension (also for addons.mozilla.org reviewers).

## Requirements
- Any OS that runs Node.js (tested on Windows 11; works on Ubuntu 24.04)
- Node.js 24 (built with 24.20.0) and npm 11 (built with 11.19.0)
- No other tools. All dependencies come from the public npm registry via `package-lock.json`.

## Build

```bash
npm ci
npm run build:firefox
```

- `npm run build` type-checks (`tsc --noEmit`) and bundles with Vite into `dist/` (Chrome build).
- `scripts/build-firefox.mjs` copies `dist/` to `dist-firefox/` and only rewrites `manifest.json` for Firefox (adds `browser_specific_settings`, removes the Chrome-only `favicon` optional permission).
- `dist-firefox/` is identical to the submitted Firefox package.

## Tools used
- [Vite](https://vite.dev/) (open source, MIT): bundles and minifies the TypeScript/Preact source in `src/`.
- [TypeScript](https://www.typescriptlang.org/) (Apache-2.0): type checking only.
- [Preact](https://preactjs.com/) (MIT): the only runtime library, bundled from npm.
- Tests only, not needed for the build: Vitest, Playwright and axe-core (`npm test`, `npm run test:e2e`).

## Source layout
- `src/`: application code (TypeScript + Preact). `src/core/` storage, validation, permissions; `src/widgets/` widget logic and views; `src/theme/`, `src/scenes/`, `src/audio/` themes, canvas scenes and WebAudio sound.
- `public/`: manifest, locales, icons (copied as-is).
- `scripts/`: build, packaging and manifest checks.
