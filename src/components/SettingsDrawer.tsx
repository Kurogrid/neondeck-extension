import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { AMBIENT_TRACKS, RADIO_STATIONS, ambientEngine, audioText, localPlayer, playSfx, radioPlayer, type AmbientTrack } from '../audio';
import { readBrowserBookmarks } from '../core/bookmarks';
import { t, type MsgKey } from '../core/i18n';
import { permSupported, permsAvailable, type OptionalPerm } from '../core/permissions';
import { CHAMFER_SIZES, LOCALES, SCANLINE_MODES, THEME_IDS, defaultSettings, type Locale, type Settings, type ThemeId } from '../core/schema';
import { ImportError, MAX_IMPORT_BYTES, exportFileName, exportJson, importJson } from '../core/transfer';
import { safeEngineUrl, slug } from '../core/validate';
import { usePermission } from '../hooks';
import { defaultWallpaperForTheme, resolveWallpaper, wallpaperLabel, wallpapersForTheme } from '../scenes/catalog';
import { CUSTOM_ACCEPT_MIME, MAX_CUSTOM_BYTES, deleteCustomWallpaper, listCustomWallpapers, saveCustomWallpaper, type CustomWallpaper } from '../scenes/mediaDb';
import type { Update } from '../state';
import { Icon } from './Icon';
import { Modal } from './Modal';

interface Props { s: Settings; update: Update; replace: (s: Settings) => void; onClose: () => void; onOpenRadio?: () => void }
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

export function SettingsDrawer({ s, update, replace, onClose, onOpenRadio }: Props) {
  const L = s.profile.locale;
  const fileRef = useRef<HTMLInputElement>(null);
  const wallInputRef = useRef<HTMLInputElement>(null);
  const customUrlsRef = useRef<Set<string>>(new Set());
  const [dataMsg, setDataMsg] = useState<Msg>(null);
  const [permMsg, setPermMsg] = useState<Msg>(null);
  const [customWalls, setCustomWalls] = useState<{ item: CustomWallpaper; url: string }[]>([]);
  const [bgErr, setBgErr] = useState('');
  const [engName, setEngName] = useState('');
  const [engUrl, setEngUrl] = useState('');
  const [engErr, setEngErr] = useState('');
  const [radioState, setRadioState] = useState(() => radioPlayer.getState());
  const visibleCount = s.search.engines.filter((e) => e.visible).length;

  useEffect(() => radioPlayer.subscribe(() => setRadioState(radioPlayer.getState())), []);

  useEffect(() => {
    let alive = true;
    void listCustomWallpapers().then((items) => {
      if (!alive) return;
      const mapped = items.map((item) => {
        const url = URL.createObjectURL(item.blob);
        customUrlsRef.current.add(url);
        return { item, url };
      });
      setCustomWalls(mapped);
    });
    return () => {
      alive = false;
      customUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      customUrlsRef.current.clear();
    };
  }, []);

  const uploadCustomWalls = async (files: FileList | null) => {
    const list = files ? Array.from(files) : [];
    if (wallInputRef.current) wallInputRef.current.value = '';
    if (!list.length) return;
    setBgErr('');
    const added: { item: CustomWallpaper; url: string }[] = [];
    for (const file of list) {
      const okMime = CUSTOM_ACCEPT_MIME.has(file.type) || /\.(jpe?g|png|webp|gif)$/i.test(file.name);
      if (!okMime) { setBgErr(t(L, 'bgErrType')); continue; }
      if (file.size > MAX_CUSTOM_BYTES) { setBgErr(t(L, 'bgErrSize')); continue; }
      try {
        const item = await saveCustomWallpaper(file);
        const url = URL.createObjectURL(item.blob);
        customUrlsRef.current.add(url);
        added.push({ item, url });
      } catch {
        setBgErr(t(L, 'bgErrStore'));
      }
    }
    if (added.length) {
      setCustomWalls((prev) => [...added.reverse(), ...prev]);
      const chosen = added[added.length - 1]!.item.id;
      update((d) => {
        d.background.kind = 'image';
        d.background.mediaId = chosen;
      });
    }
  };

  const removeCustomWall = async (id: string) => {
    await deleteCustomWallpaper(id);
    setCustomWalls((prev) => {
      const target = prev.find((x) => x.item.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
        customUrlsRef.current.delete(target.url);
      }
      return prev.filter((x) => x.item.id !== id);
    });
    if (s.background.kind === 'image' && s.background.mediaId === id) {
      update((d) => {
        d.background.kind = 'scene';
        d.background.sceneId = defaultWallpaperForTheme(d.theme.id).id;
        delete d.background.mediaId;
      });
    }
  };

  const pickTheme = (nextTheme: ThemeId) => {
    update((d) => {
      d.theme.id = nextTheme;
      if (d.background.kind === 'scene') {
        d.background.sceneId = defaultWallpaperForTheme(nextTheme).id;
      }
    });
  };

  const themeWalls = wallpapersForTheme(s.theme.id);
  const resolvedWall = resolveWallpaper(s.theme.id, s.background.sceneId);

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
  const toggle = (label: string, checked: boolean, onChange: (v: boolean) => void, extraClass = '') => (
    <label class={`nd-check${extraClass ? ` ${extraClass}` : ''}`}><input type="checkbox" checked={checked} onChange={(e) => onChange(e.currentTarget.checked)} /> {label}</label>
  );

  const onRadioKey = <K extends string>(options: readonly K[], index: number, onChange: (v: K) => void, e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const nextIdx = (index + step + options.length) % options.length;
    const nextVal = options[nextIdx];
    if (nextVal !== undefined) onChange(nextVal);
    const parent = (e.currentTarget as HTMLElement).parentElement;
    const btn = parent?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[nextIdx];
    btn?.focus();
  };

  const segmented = <K extends string>(label: MsgKey, value: K, options: readonly K[], optLabel: (o: K) => string, onChange: (v: K) => void) => {
    const labelId = `nd-lbl-${label}`;
    return (
      <div class="nd-field">
        <span id={labelId}>{t(L, label)}</span>
        <div class="nd-seg" role="radiogroup" aria-labelledby={labelId}>
          {options.map((o, i) => (
            <button key={o} type="button" role="radio" aria-checked={value === o} class="nd-seg__btn"
              onClick={() => onChange(o)} onKeyDown={(e) => onRadioKey(options, i, onChange, e)}>
              {optLabel(o)}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Modal title={t(L, 'settings')} closeLabel={t(L, 'close')} onClose={onClose} variant="drawer-left">
      <Section title={t(L, 'secIdentity')}>
        <label class="nd-field"><span>{t(L, 'userName')}</span>
          <input data-autofocus value={s.profile.userName} maxLength={40} onInput={(e) => { const v = e.currentTarget.value; update((d) => { d.profile.userName = v; }); }} /></label>
        {select('language', s.profile.locale, LOCALES, (o) => LANG_NAMES[o], (v) => update((d) => { d.profile.locale = v; }))}
      </Section>

      <Section title={t(L, 'secAppearance')}>
        <div class="nd-field">
          <span id="nd-lbl-theme">{t(L, 'theme')}</span>
          <div class="nd-theme-grid" role="radiogroup" aria-labelledby="nd-lbl-theme">
            {THEME_IDS.map((o, i) => (
              <button key={o} type="button" role="radio" aria-checked={s.theme.id === o} class="nd-theme-card nd-chamfer" data-theme-card={o}
                onClick={() => pickTheme(o)}
                onKeyDown={(e) => onRadioKey(THEME_IDS, i, pickTheme, e)}>
                <span class="nd-theme-card__top">
                  <span class="nd-theme-card__swatches" aria-hidden="true">
                    <span class="nd-swatch nd-swatch--pri" />
                    <span class="nd-swatch nd-swatch--sec" />
                    <span class="nd-swatch nd-swatch--acc" />
                  </span>
                  <span class="nd-theme-card__pip" aria-hidden="true" />
                </span>
                <span class="nd-theme-card__name">{t(L, `theme_${o}`)}</span>
              </button>
            ))}
          </div>
        </div>
        <div class="nd-field">
          <span id="nd-lbl-wall">{t(L, 'wallpaper')}</span>
          <div class="nd-wall-grid" role="radiogroup" aria-labelledby="nd-lbl-wall">
            {themeWalls.map((w, i) => {
              const active = s.background.kind === 'scene' && resolvedWall.id === w.id;
              const pickWall = (nextId: string) => update((d) => {
                d.background.kind = 'scene';
                d.background.sceneId = nextId;
                delete d.background.mediaId;
              });
              return (
                <button
                  key={w.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  class="nd-wall-card nd-chamfer"
                  onClick={() => pickWall(w.id)}
                  onKeyDown={(e) => onRadioKey(themeWalls.map((x) => x.id), i, pickWall, e)}
                >
                  {(w.thumb ?? w.image) ? <img class="nd-wall-card__thumb" data-pos={w.position === 'top' ? 'top' : undefined} src={w.thumb ?? w.image} alt="" loading="lazy" /> : <span class="nd-wall-card__thumb nd-wall-card__thumb--scene" aria-hidden="true" />}
                  <span class="nd-wall-card__meta">
                    <span class="nd-wall-card__name">{wallpaperLabel(w, L)}</span>
                    <span class={`nd-wall-card__tag ${w.live ? 'nd-wall-card__tag--live' : ''}`}>{t(L, w.live ? 'bgLive' : 'bgStatic')}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <label class="nd-field">
          <span class="nd-row"><span>{t(L, 'bgBrightness')}</span><span class="nd-amb__pct">{s.background.brightness}%</span></span>
          <input
            type="range"
            class="nd-range"
            min={30}
            max={120}
            value={s.background.brightness}
            onInput={(e) => {
              const v = Math.max(30, Math.min(120, Number(e.currentTarget.value)));
              update((d) => { d.background.brightness = v; });
            }}
          />
        </label>
        <div class="nd-field">
          <div class="nd-custom-head">
            <span id="nd-lbl-custom">{t(L, 'bgCustomTitle')}</span>
            <button type="button" class="nd-btn nd-btn--sm" onClick={() => wallInputRef.current?.click()}>
              <Icon name="upload" size={14} /> {t(L, 'bgUploadBtn')}
            </button>
            <input
              ref={wallInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              class="nd-file-input"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => void uploadCustomWalls(e.currentTarget.files)}
            />
          </div>
          {customWalls.length > 0 && (
            <div class="nd-custom-grid" role="radiogroup" aria-labelledby="nd-lbl-custom">
              {customWalls.map(({ item, url }) => {
                const active = s.background.kind === 'image' && s.background.mediaId === item.id;
                return (
                  <div key={item.id} class="nd-custom-wrap">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={active}
                      class="nd-wall-card nd-chamfer"
                      onClick={() => update((d) => {
                        d.background.kind = 'image';
                        d.background.mediaId = item.id;
                      })}
                    >
                      <img class="nd-wall-card__thumb" src={url} alt="" />
                      <span class="nd-wall-card__meta">
                        <span class="nd-wall-card__name">{item.name}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      class="nd-custom-del"
                      aria-label={t(L, 'bgDelete', { name: item.name })}
                      title={t(L, 'bgDelete', { name: item.name })}
                      onClick={() => void removeCustomWall(item.id)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {bgErr && <p class="nd-error" role="alert">{bgErr}</p>}
          <p class="nd-hint">{t(L, 'bgUploadHint')}</p>
        </div>
        {segmented('scanlines', s.theme.scanlines, SCANLINE_MODES, (o) => t(L, `scan_${o}`), (v) => update((d) => { d.theme.scanlines = v; }))}
        {segmented('chamfer', s.theme.chamfer, CHAMFER_SIZES, (o) => t(L, `chamfer_${o}`), (v) => update((d) => { d.theme.chamfer = v; }))}
        {toggle(t(L, 'glitch'), s.theme.glitch, (v) => update((d) => { d.theme.glitch = v; }), 'nd-check--switch')}
        {toggle(t(L, 'lowPower'), s.theme.lowPower, (v) => update((d) => { d.theme.lowPower = v; }), 'nd-check--switch')}
      </Section>

      <Section title={audioText(L, 'secAudio')}>
        {toggle(
          audioText(L, 'uiSfx'),
          s.audio.uiSfx,
          (v) => {
            update((d) => { d.audio.uiSfx = v; });
            if (v) playSfx('toggle', true, s.audio.volume);
          },
          'nd-check--switch',
        )}
        <label class="nd-field">
          <span class="nd-row"><span>{audioText(L, 'sfxVolume')}</span><span class="nd-amb__pct">{Math.round(s.audio.volume * 100)}%</span></span>
          <input
            type="range"
            class="nd-range"
            min={0}
            max={100}
            value={Math.round(s.audio.volume * 100)}
            onInput={(e) => {
              const v = Math.max(0, Math.min(1, Number(e.currentTarget.value) / 100));
              update((d) => { d.audio.volume = v; });
            }}
          />
        </label>
        <div class="nd-field">
          <span id="nd-lbl-amb-track">{audioText(L, 'ambientTrack')}</span>
          <div class="nd-amb-grid" role="radiogroup" aria-labelledby="nd-lbl-amb-track">
            {AMBIENT_TRACKS.map((tr, i) => {
              const pickTrack = (next: AmbientTrack) => {
                update((d) => { d.audio.ambient.track = next; });
                if (next === 'off') ambientEngine.stop();
                else ambientEngine.start(next, s.audio.ambient.volume);
              };
              return (
                <button
                  key={tr}
                  type="button"
                  role="radio"
                  aria-checked={s.audio.ambient.track === tr}
                  class="nd-seg__btn"
                  onClick={() => pickTrack(tr)}
                  onKeyDown={(e) => onRadioKey(AMBIENT_TRACKS, i, pickTrack, e)}
                >
                  {audioText(L, `track_${tr}`)}
                </button>
              );
            })}
          </div>
        </div>
        <label class="nd-field">
          <span class="nd-row"><span>{audioText(L, 'ambVolume')}</span><span class="nd-amb__pct">{Math.round(s.audio.ambient.volume * 100)}%</span></span>
          <input
            type="range"
            class="nd-range"
            min={0}
            max={100}
            value={Math.round(s.audio.ambient.volume * 100)}
            onInput={(e) => {
              const v = Math.max(0, Math.min(1, Number(e.currentTarget.value) / 100));
              update((d) => { d.audio.ambient.volume = v; });
              ambientEngine.setVolume(v);
              localPlayer.setVolume(v);
              radioPlayer.setVolume(v);
            }}
          />
        </label>
        {RADIO_STATIONS.length > 0 && (() => {
          const st = RADIO_STATIONS.find((x) => x.id === radioState.stationId) ?? RADIO_STATIONS[0]!;
          const tr = st.tracks[radioState.trackIndex] ?? st.tracks[0];
          const num = String((tr?.index ?? 0) + 1).padStart(2, '0');
          return (
            <div class="nd-settings-radio">
              <div class="nd-settings-radio__meta">
                <span class="nd-radio__artist">{st.name}</span>
                {tr && <span class="nd-radio__title">#{num} {tr.title} — {tr.artist}</span>}
              </div>
              <div class="nd-row">
                {radioState.source === 'mp3' && (
                  <button
                    type="button"
                    class={`nd-btn nd-btn--sm${radioState.playing ? '' : ' nd-btn--primary'}`}
                    onClick={() => radioPlayer.togglePlayPause(s.audio.ambient.volume)}
                  >
                    <Icon name={radioState.playing ? 'pause' : 'play2'} size={13} />
                    {audioText(L, radioState.playing ? 'ambStop' : 'ambPlay')}
                  </button>
                )}
                {onOpenRadio && (
                  <button type="button" class="nd-btn nd-btn--sm" onClick={onOpenRadio}>
                    <Icon name="radio" size={13} /> {audioText(L, 'radioOpen')}
                  </button>
                )}
              </div>
            </div>
          );
        })()}
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
