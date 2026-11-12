// Release packages (owner [claude]). Run via `npm run package` (verify + Firefox build run first).
//   release/neondeck-<v>-chrome.zip   Chrome Web Store upload (from dist/)
//   release/neondeck-<v>-firefox.zip  addons.mozilla.org upload (from dist-firefox/)
//   release/neondeck-<v>-source.zip   source for AMO reviewers (they rebuild and diff; see BUILD.md)
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { makeZip } from './zip.mjs';

const MAX_BYTES = 5 * 1024 * 1024; // SPEC §10: package < 5 MB
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const errs = [];

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out); else out.push(full);
  }
  return out;
};
const zipDir = (dir) => {
  const files = walk(dir).map((f) => ({ name: relative(dir, f).split(sep).join('/'), data: readFileSync(f) }));
  for (const { name } of files) {
    if (name.split('/').some((p) => p.startsWith('.'))) errs.push(`hidden file in ${dir}: ${name}`);
    if (name.endsWith('.map')) errs.push(`source map in ${dir}: ${name}`);
  }
  const m = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
  if (m.version !== pkg.version) errs.push(`${dir} manifest version ${m.version} != package.json ${pkg.version}`);
  return { zip: makeZip(files), count: files.length };
};

// Source package: tracked files needed to rebuild, nothing personal (no docs/, notes or local tool config).
const SOURCE_INCLUDE = ['BUILD.md', 'LICENSE', 'LICENSES.md', 'README.md', 'index.html', 'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts', 'public/', 'scripts/', 'src/'];
const tracked = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean);
const sourceFiles = tracked
  .filter((f) => SOURCE_INCLUDE.some((inc) => (inc.endsWith('/') ? f.startsWith(inc) : f === inc)))
  .map((f) => ({ name: f, data: readFileSync(f) }));
for (const inc of SOURCE_INCLUDE) if (!sourceFiles.some((f) => (inc.endsWith('/') ? f.name.startsWith(inc) : f.name === inc))) errs.push(`source package is missing ${inc} (is it committed?)`);
if (execSync('git status --porcelain -- ' + SOURCE_INCLUDE.join(' '), { encoding: 'utf8' }).trim()) errs.push('uncommitted changes in source files: commit first so the source zip matches the build');

const outputs = [
  ['chrome', zipDir('dist')],
  ['firefox', zipDir('dist-firefox')],
  ['source', { zip: makeZip(sourceFiles), count: sourceFiles.length }],
];
for (const [kind, { zip }] of outputs) if (kind !== 'source' && zip.length > MAX_BYTES) errs.push(`${kind} zip is ${(zip.length / 1048576).toFixed(2)} MB (limit 5 MB)`);

if (errs.length) { console.error('PACKAGE FAILED:\n- ' + errs.join('\n- ')); process.exit(1); }
mkdirSync('release', { recursive: true });
for (const [kind, { zip, count }] of outputs) {
  const out = `release/neondeck-${pkg.version}-${kind}.zip`;
  writeFileSync(out, zip);
  console.log(`${out}: ${count} files, ${(zip.length / 1024).toFixed(1)} kB`);
}
