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
for (const f of Object.values(m.icons ?? {})) if (!existsSync('dist/' + f)) errs.push('missing icon ' + f);
if (!existsSync('dist/' + m.chrome_url_overrides?.newtab)) errs.push('missing newtab page');
const html = readFileSync('dist/index.html', 'utf8');
if (/<script(?![^>]*\bsrc=)[^>]*>[^<]/.test(html)) errs.push('inline script in index.html');
// Third-party fan art must never ship in a public build.
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(d + '/' + e.name) : [d + '/' + e.name]);
for (const f of walk('dist')) if (/(^|\/)fan-[^/]*$/i.test(f)) errs.push('fan-edition asset in build: ' + f);
if (errs.length) { console.error('MANIFEST CHECK FAILED:\n- ' + errs.join('\n- ')); process.exit(1); }
console.log('manifest check OK');
