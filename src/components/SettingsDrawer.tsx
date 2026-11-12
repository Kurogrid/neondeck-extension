import type { ComponentChildren } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { readBrowserBookmarks } from '../core/bookmarks';
import { t, type MsgKey } from '../core/i18n';
import { permSupported, permsAvailable, type OptionalPerm } from '../core/permissions';
import { CHAMFER_SIZES, LOCALES, SCANLINE_MODES, THEME_IDS, defaultSettings, type Locale, type Settings } from '../core/schema';
import { ImportError, MAX_IMPORT_BYTES, exportFileName, exportJson, importJson } from '../core/transfer';
import { safeEngineUrl, slug } from '../core/validate';
import { usePermission } from '../hooks';
import type { Update } from '../state';
import { Icon } from './Icon';
import { Modal } from './Modal';

interface Props { s: Settings; update: Update; replace: (s: Settings) => void; onClose: () => void }
type Msg = { kind: 'ok' | 'err'; lines: string[] } | null;

const LANG_NAMES: Record<Locale, string> = { en: 'English', tr: 'Türkçe' };
const DISPLAY_KEYS = ['showGreeting', 'showTime', 'showDate', 'showSearch', 'showQuotes', 'showNetlinks', 'showWidgets'] as const;

function Section({ title, children }: { title: string; children: ComponentChildren }) {
  return <section class="nd-set"><h3 class="nd-set__title">{title}</h3>{children}</section>;
}
function Status({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return <div class={msg.kind === 'ok' ? 'nd-note' : 'nd-error'} role={msg.kind === 'ok' ? 'status' : 'alert'}>{msg.lines.map((l) => <p key={l}>{l}</p>)}</div>;
}

function PermissionRow({ L, perm, extra }: { L: Locale; perm: OptionalPerm; extra?: (p: ReturnType<typeof usePermission>) => ComponentChildren }) {
  const p = usePermission(perm);
  return (
    <div class="nd-perm">
      <div class="nd-perm__info">
        <span>{t(L, `perm_${perm}`)}</span>
        <span class={`nd-badge ${p.granted ? 'nd-badge--on' : ''}`}>{t(L, p.granted ? 'permGranted' : 'permNotGranted')}</span>
      </div>
      <div class="nd-perm__actions">
        {p.granted
          ? <button type="button" class="nd-btn nd-btn--sm" onClick={() => void p.revoke()}>{t(L, 'revoke')}</button>
          : <button type="button" class="nd-btn nd-btn--sm" disabled={!p.available} onClick={() => void p.request()}>{t(L, 'grant')}</button>}
        {extra?.(p)}
      </div>
    </div>
  );
}

export function SettingsDrawer({ s, update, replace, onClose }: Props) {
  const L = s.profile.locale;
  const fileRef = useRef<HTMLInputElement>(null);
  const [dataMsg, setDataMsg] = useState<Msg>(null);
  const [permMsg, setPermMsg] = useState<Msg>(null);
  const [engName, setEngName] = useState('');
  const [engUrl, setEngUrl] = useState('');
  const [engErr, setEngErr] = useState('');
  const visibleCount = s.search.engines.filter((e) => e.visible).length;

  const ensureActiveVisible = (d: Settings) => {
    if (!d.search.engines.some((e) => e.id === d.search.active && e.visible)) d.search.active = d.search.engines.find((e) => e.visible)?.id ?? d.search.engines[0]!.id;
  };

  const addEngine = (e: Event) => {
    e.preventDefault();
    const url = safeEngineUrl(engUrl);
    const name = engName.trim().slice(0, 30);
    if (!url || !name) { setEngErr(t(L, 'engineInvalid')); return; }
    update((d) => {
      let id = slug(name) || 'engine';
      while (d.search.engines.some((x) => x.id === id)) id += '-2';
      d.search.engines.push({ id, name, url, placeholder: '', visible: true });
    });
    setEngName(''); setEngUrl(''); setEngErr('');
  };

  const doExport = () => {
    const blob = new Blob([exportJson(s)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = exportFileName();
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  const doImport = async (file: File | undefined) => {
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) { setDataMsg({ kind: 'err', lines: [t(L, 'importErr_tooLarge')] }); return; }
    try {
      const res = importJson(await file.text());
      if (!window.confirm(t(L, 'importConfirm'))) return;
      replace(res.settings);
      const lines = [t(res.settings.profile.locale, res.source === 'cyberstart' ? 'importOkCyberstart' : 'importOk')];
      for (const w of res.warnings) lines.push(t(res.settings.profile.locale, `warn_${w}`));
      setDataMsg({ kind: 'ok', lines });
    } catch (err) {
      const code = err instanceof ImportError ? err.code : 'invalidJson';
      setDataMsg({ kind: 'err', lines: [t(L, `importErr_${code}`)] });
    }
  };

  const doReset = () => {
    if (window.confirm(t(L, 'resetConfirm'))) { replace(defaultSettings(L)); setDataMsg(null); }
  };

  const importBookmarks = async (p: ReturnType<typeof usePermission>) => {
    // request() must run inside the click gesture, so it is the first await.
    const ok = p.granted || (await p.request());
    if (!ok) return;
    try {
      const links = await readBrowserBookmarks(new Set(s.netlinks.items.map((l) => l.url)));
      if (links.length) update((d) => {
        d.netlinks.items.push(...links);
        if (!d.netlinks.categoryOrder.includes('bookmarks')) d.netlinks.categoryOrder.push('bookmarks');
      });
      setPermMsg({ kind: 'ok', lines: [links.length ? t(L, 'bookmarksImported', { count: links.length }) : t(L, 'bookmarksNone')] });
    } catch {
      setPermMsg({ kind: 'err', lines: [t(L, 'permDevMode')] });
    }
  };

  const select = <K extends string>(label: MsgKey, value: K, options: readonly K[], optLabel: (o: K) => string, onChange: (v: K) => void) => (
    <label class="nd-field nd-field--row"><span>{t(L, label)}</span>
      <select value={value} onChange={(e) => onChange(e.currentTarget.value as K)}>
        {options.map((o) => <option key={o} value={o}>{optLabel(o)}</option>)}
      </select>
    </label>
  );
  const toggle = (label: string, checked: boolean, onChange: (v: boolean) => void) => (
    <label class="nd-check"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.currentTarget.checked)} /> {label}</label>
  );

  return (
    <Modal title={t(L, 'settings')} closeLabel={t(L, 'close')} onClose={onClose} variant="drawer-left">
      <Section title={t(L, 'secIdentity')}>
        <label class="nd-field"><span>{t(L, 'userName')}</span>
          <input data-autofocus value={s.profile.userName} maxLength={40} onInput={(e) => { const v = e.currentTarget.value; update((d) => { d.profile.userName = v; }); }} /></label>
        {select('language', s.profile.locale, LOCALES, (o) => LANG_NAMES[o], (v) => update((d) => { d.profile.locale = v; }))}
      </Section>

      <Section title={t(L, 'secAppearance')}>
        {select('theme', s.theme.id, THEME_IDS, (o) => t(L, `theme_${o}`), (v) => update((d) => { d.theme.id = v; }))}
        {select('scanlines', s.theme.scanlines, SCANLINE_MODES, (o) => t(L, `scan_${o}`), (v) => update((d) => { d.theme.scanlines = v; }))}
        {select('chamfer', s.theme.chamfer, CHAMFER_SIZES, (o) => t(L, `chamfer_${o}`), (v) => update((d) => { d.theme.chamfer = v; }))}
        {toggle(t(L, 'glitch'), s.theme.glitch, (v) => update((d) => { d.theme.glitch = v; }))}
        {toggle(t(L, 'lowPower'), s.theme.lowPower, (v) => update((d) => { d.theme.lowPower = v; }))}
      </Section>

      <Section title={t(L, 'secDisplay')}>
        {select('timeFormat', s.display.timeFormat, ['24h', '12h'] as const, (o) => t(L, `time_${o}`), (v) => update((d) => { d.display.timeFormat = v; }))}
        <div class="nd-checks">
          {DISPLAY_KEYS.map((k) => <span key={k}>{toggle(t(L, k), s.display[k], (v) => update((d) => { d.display[k] = v; }))}</span>)}
        </div>
        <label class="nd-field"><span>{t(L, 'tabTitle')}</span>
          <input value={s.tab.title} maxLength={60} onInput={(e) => { const v = e.currentTarget.value; update((d) => { d.tab.title = v.trim() ? v : 'New Tab'; }); }} /></label>
      </Section>

      <Section title={t(L, 'secSearch')}>
        <ul class="nd-engines">
          {s.search.engines.map((en) => (
            <li key={en.id} class="nd-engine">
              <label class="nd-check">
                <input type="checkbox" checked={en.visible} disabled={en.visible && visibleCount === 1} aria-label={t(L, 'engineVisible', { name: en.name })}
                  onChange={(e) => { const v = e.currentTarget.checked; update((d) => { d.search.engines.find((x) => x.id === en.id)!.visible = v; ensureActiveVisible(d); }); }} />
                <span class="nd-engine__name">{en.name}</span>
              </label>
              <button type="button" class="nd-icon-btn nd-icon-btn--sm nd-icon-btn--danger" aria-label={t(L, 'removeEngine', { name: en.name })} title={t(L, 'removeEngine', { name: en.name })}
                disabled={s.search.engines.length === 1 || (en.visible && visibleCount === 1)}
                onClick={() => update((d) => { d.search.engines = d.search.engines.filter((x) => x.id !== en.id); ensureActiveVisible(d); })}>
                <Icon name="trash" size={16} />
              </button>
            </li>
          ))}
        </ul>
        <form class="nd-form nd-form--inline" onSubmit={addEngine} noValidate>
          <label class="nd-field"><span>{t(L, 'engineName')}</span><input value={engName} maxLength={30} onInput={(e) => setEngName(e.currentTarget.value)} /></label>
          <label class="nd-field"><span>{t(L, 'engineUrl')}</span><input type="url" value={engUrl} placeholder="https://example.com/search?q=%s" onInput={(e) => setEngUrl(e.currentTarget.value)} /></label>
          {engErr && <p class="nd-error" role="alert">{engErr}</p>}
          <button type="submit" class="nd-btn nd-btn--sm"><Icon name="plus" size={16} /> {t(L, 'addEngine')}</button>
        </form>
      </Section>

      <Section title={t(L, 'secPermissions')}>
        <p class="nd-hint">{t(L, 'permIntro')}</p>
        {permSupported('favicon') && <PermissionRow L={L} perm="favicon" />}
        <PermissionRow L={L} perm="bookmarks" extra={(p) => (
          <button type="button" class="nd-btn nd-btn--sm" disabled={!p.available} onClick={() => void importBookmarks(p)}>{t(L, 'importBookmarks')}</button>
        )} />
        {!permsAvailable() && <p class="nd-hint">{t(L, 'permDevMode')}</p>}
        <Status msg={permMsg} />
      </Section>

      <Section title={t(L, 'secData')}>
        <p class="nd-hint">{t(L, 'importHint')}</p>
        <div class="nd-row">
          <button type="button" class="nd-btn nd-btn--sm" onClick={doExport}><Icon name="download" size={16} /> {t(L, 'exportBtn')}</button>
          <button type="button" class="nd-btn nd-btn--sm" onClick={() => fileRef.current?.click()}><Icon name="upload" size={16} /> {t(L, 'importBtn')}</button>
          <input ref={fileRef} type="file" accept=".json,application/json" class="nd-hidden" tabIndex={-1} aria-hidden="true"
            onChange={(e) => void doImport(e.currentTarget.files?.[0])} />
        </div>
        <Status msg={dataMsg} />
        <button type="button" class="nd-btn nd-btn--sm nd-btn--danger" onClick={doReset}>{t(L, 'resetBtn')}</button>
      </Section>
    </Modal>
  );
}
