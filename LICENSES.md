# Licenses

NEONDECK itself is released under the MIT License (see `LICENSE`). This file lists third-party material.

What ships inside the NEONDECK package (`dist/`) and under which license.

## Code bundled into the extension
| Package | License | Notes |
|---|---|---|
| [Preact](https://github.com/preactjs/preact) | MIT | UI library, bundled by Vite |

Build and test tools (Vite, TypeScript, Vitest, Playwright, axe-core, @preact/preset-vite, @types/chrome) are development-only and are not shipped.

## Assets
| Asset | Source | License |
|---|---|---|
| UI icons (`src/components/Icon.tsx`) | Custom cyberpunk HUD SVG icon set drawn for NEONDECK | Project's own |
| Extension icons (`public/icons/*.png`) | NEONDECK brand kit (Kurogrid) | Project's own |
| Audio engine (`src/audio/`) | Procedural WebAudio UI sounds, rain and synth pad, 5 theme tracks (`src/audio/themes.ts`) and the local IndexedDB player | Project's own |
| Arasaka emblem and wordmark (`src/components/ArasakaBanner.tsx`) | Original gate mark and KUROGRID block letters drawn for NEONDECK | Project's own |
| Wallpapers (`public/wallpapers/*.webp`) | 13 original cyberpunk scenes crafted for NEONDECK (Edgerunners, Ghost, Acid Orchid, Samurai; Arasaka uses an animated canvas scene) | Project's own |
| Quote line | A short quotation chosen by the project owner | Quoted for flavour; not covered by NEONDECK's MIT license |

No third-party fonts, sounds, images or videos are bundled.

## To fill in later
Any sound loops, fonts or images added later are listed here (source URL, author, license, and which file uses it) before release. Only licenses that allow redistribution inside a free extension are acceptable (e.g. CC0, CC BY with attribution, OFL for fonts).

## Services used at runtime (not bundled)
| Service | Used for | Terms |
|---|---|---|
| Spotify embedded player | Optional radio, loaded only after the user opens it | https://www.spotify.com/legal/end-user-agreement/ |
| Open-Meteo | Weather and city search (only when the Weather widget is on) | https://open-meteo.com/en/terms (free for non-commercial use; attribution "Weather data by Open-Meteo.com", CC BY 4.0) |
