import { readFileSync, existsSync, readdirSync } from 'node:fs';
const m = JSON.parse(readFileSync('dist/manifest.json', 'utf8'));
const errs = [];
if (m.manifest_version !== 3) errs.push('manifest_version must be 3');
if (JSON.stringify(m.permissions) !== '["storage"]') errs.push('permissions must be exactly ["storage"]');
if ((m.host_permissions ?? []).length) errs.push('host_permissions must be empty');
if ((m.optional_host_permissions ?? []).length) errs.push('optional_host_permissions must be empty');
if ((m.content_scripts ?? []).length) errs.push('content_scripts must be empty');
if (JSON.stringify(m.optional_permissions ?? []) !== '["favicon","bookmarks"]') errs.push('optional_permissions must be exactly ["favicon","bookmarks"]');
const csp = m.content_security_policy?.extension_pages ?? '';
if (/unsafe-(inline|eval)/.test(csp)) errs.push('CSP has unsafe-*');
const frames = (csp.match(/frame-src ([^;]*)/) || [, ''])[1].trim();
if (frames && frames !== 'https://open.spotify.com') errs.push('frame-src may only allow https://open.spotify.com (radio embed), got: ' + frames);
// Each directive is pinned: loosening one has to be a deliberate change here too.
const directive = (name) => (csp.split(';').map((d) => d.trim()).find((d) => d.startsWith(name + ' ')) ?? '').slice(name.length).trim();
const pinned = {
  'script-src': "'self'",
  'object-src': "'self'",
  'style-src': "'self'",
  'worker-src': "'self'",
  'connect-src': 'https://api.open-meteo.com https://geocoding-api.open-meteo.com',
};
for (const [name, want] of Object.entries(pinned)) if (directive(name) !== want) errs.push(`CSP ${name} must be "${want}", got "${directive(name)}"`);
for (const f of Object.values(m.icons ?? {})) if (!existsSync('dist/' + f)) errs.push('missing icon ' + f);
if (!existsSync('dist/' + m.chrome_url_overrides?.newtab)) errs.push('missing newtab page');
const html = readFileSync('dist/index.html', 'utf8');
if (/<script(?![^>]*\bsrc=)[^>]*>[^<]/.test(html)) errs.push('inline script in index.html');
// Third-party fan art must never ship in a public build.
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(d + '/' + e.name) : [d + '/' + e.name]);
for (const f of walk('dist')) if (/(^|\/)fan-[^/]*$/i.test(f)) errs.push('fan-edition asset in build: ' + f);
if (/<style[\s>]/i.test(html)) errs.push('inline <style> in index.html (style-src is self only)');
if (/<script[^>]*\bsrc=["']?(https?:)?\/\//i.test(html)) errs.push('remote script in index.html');
// Built code: no string-to-code and no remote module loads.
for (const f of walk('dist').filter((f) => f.endsWith('.js'))) {
  const js = readFileSync(f, 'utf8');
  if (/\beval\s*\(|\bnew Function\s*\(/.test(js)) errs.push('eval/new Function in ' + f);
  if (/\bimport\s*\(\s*["'`]https?:/.test(js) || /\bimportScripts\s*\(/.test(js)) errs.push('remote code load in ' + f);
}
// Size budgets for the code that loads on every new tab (wallpapers are fetched only when shown).
const kb = (ext) => walk('dist/assets').filter((f) => f.endsWith(ext)).reduce((n, f) => n + readFileSync(f).length, 0) / 1024;
if (kb('.js') > 300) errs.push(`JS bundle ${kb('.js').toFixed(0)} KB exceeds 300 KB budget`);
if (kb('.css') > 120) errs.push(`CSS bundle ${kb('.css').toFixed(0)} KB exceeds 120 KB budget`);
if (errs.length) { console.error('MANIFEST CHECK FAILED:\n- ' + errs.join('\n- ')); process.exit(1); }
console.log('manifest check OK');
