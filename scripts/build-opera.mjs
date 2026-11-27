// Opera build: `vite build --minify false --outDir dist-opera` first (npm run build:opera does both),
// then this script rewrites the manifest for addons.opera.com.
// Opera's acceptance criteria: extensions may not replace Opera's start page, manifests may not carry
// unnecessary entries, and code must be reviewable (not minified). Opera ignores the new tab override
// anyway; users open NEONDECK from the toolbar button (public/background.js).
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const DIR = 'dist-opera';
const m = JSON.parse(readFileSync(`${DIR}/manifest.json`, 'utf8'));
delete m.chrome_url_overrides;
// Opera's validator rejects the Chrome-only `favicon` permission (the favicon feature hides itself without it).
m.optional_permissions = (m.optional_permissions ?? []).filter((p) => p !== 'favicon');
writeFileSync(`${DIR}/manifest.json`, JSON.stringify(m, null, 2) + '\n');

const errs = [];
if (m.chrome_url_overrides) errs.push('chrome_url_overrides must be removed');
if (JSON.stringify(m.permissions) !== '["storage"]') errs.push('permissions must be exactly ["storage"]');
if (JSON.stringify(m.optional_permissions) !== '["bookmarks"]') errs.push('optional_permissions must be exactly ["bookmarks"]');
if ((m.host_permissions ?? []).length || (m.content_scripts ?? []).length) errs.push('no host permissions / content scripts');
if (m.background?.service_worker !== 'background.js' || !m.action) errs.push('toolbar button (action + background.js) is required');
for (const page of ['index.html', 'welcome.html', 'background.js']) if (!existsSync(`${DIR}/${page}`)) errs.push('missing ' + page);
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(d + '/' + e.name) : [d + '/' + e.name]);
for (const f of walk(DIR)) {
  if (/(^|\/)fan-[^/]*$/i.test(f)) errs.push('fan-edition asset in build: ' + f);
  if (f.endsWith('.map')) errs.push('source map in build: ' + f);
}
// Not minified: our own code keeps its identifiers (a minified bundle would not contain this name).
const js = walk(`${DIR}/assets`).filter((f) => f.endsWith('.js')).map((f) => readFileSync(f, 'utf8')).join('\n');
if (!js.includes('detectBrowser')) errs.push('bundle looks minified (expected readable identifiers)');
if (errs.length) { console.error('OPERA BUILD FAILED:\n- ' + errs.join('\n- ')); process.exit(1); }
console.log(`${DIR}/ ready (no new tab override, not minified)`);
