// Firefox build: copies dist/ to dist-firefox/ and rewrites the manifest for Firefox/AMO.
// Run after `vite build` (npm run build:firefox does both).
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

export const GECKO_ID = 'neondeck@kurogrid.github.io';

rmSync('dist-firefox', { recursive: true, force: true });
cpSync('dist', 'dist-firefox', { recursive: true });

const m = JSON.parse(readFileSync('dist/manifest.json', 'utf8'));
// Firefox has no `favicon` permission (the favicon feature hides itself when the manifest lacks it).
m.optional_permissions = (m.optional_permissions ?? []).filter((p) => p !== 'favicon');
// Firefox runs extension background code as event pages, not service workers.
if (m.background?.service_worker) m.background = { scripts: [m.background.service_worker] };
m.browser_specific_settings = {
  gecko: {
    id: GECKO_ID,
    // 140 = first desktop version with the built-in data consent UI used below.
    strict_min_version: '140.0',
    data_collection_permissions: {
      required: ['none'],
      // Weather widget: the chosen city and rounded coordinates go to Open-Meteo, only after the user opts in.
      optional: ['locationInfo'],
    },
  },
};
writeFileSync('dist-firefox/manifest.json', JSON.stringify(m, null, 2) + '\n');

const errs = [];
if (JSON.stringify(m.permissions) !== '["storage"]') errs.push('permissions must be exactly ["storage"]');
if (JSON.stringify(m.optional_permissions) !== '["bookmarks"]') errs.push('optional_permissions must be exactly ["bookmarks"]');
if ((m.host_permissions ?? []).length || (m.content_scripts ?? []).length) errs.push('no host permissions / content scripts');
if (JSON.stringify(m.background) !== '{"scripts":["background.js"]}') errs.push('background must be { scripts: ["background.js"] }');
if (errs.length) { console.error('FIREFOX BUILD FAILED:\n- ' + errs.join('\n- ')); process.exit(1); }
console.log(`dist-firefox/ ready (gecko id ${GECKO_ID}, Firefox >= 140)`);
