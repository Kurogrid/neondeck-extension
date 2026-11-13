# Licenses

NEONDECK itself is released under the MIT License (see `LICENSE`). This file lists third-party material.

What ships inside the NEONDECK package (`dist/`) and under which license.

## Code bundled into the extension
| Package | License | Notes |
|---|---|---|
| [Preact](https://github.com/preactjs/preact) | MIT | UI library, bundled by Vite |

Build and test tools (Vite, TypeScript, Vitest, @preact/preset-vite, @types/chrome) are development-only and are not shipped.

## Assets
| Asset | Source | License |
|---|---|---|
| UI icons (`src/components/Icon.tsx`) | Drawn for NEONDECK | Project's own |
| Extension icons (`public/icons/*.png`) | Placeholders made for NEONDECK | Project's own |
| Quote line | Chosen by the project owner | See `docs/yayin-kontrol-listesi.md` (origin check) |

No fonts, sounds, images or videos from third parties are bundled yet.

## To fill in later
Any sound loops, fonts or images added later are listed here (source URL, author, license, and which file uses it) before release. Only licenses that allow redistribution inside a free extension are acceptable (e.g. CC0, CC BY with attribution, OFL for fonts).

## Services used at runtime (not bundled)
| Service | Used for | Terms |
|---|---|---|
| Open-Meteo | Weather and city search (only when the Weather widget is on) | https://open-meteo.com/en/terms (free for non-commercial use; attribution "Weather data by Open-Meteo.com", CC BY 4.0) |
