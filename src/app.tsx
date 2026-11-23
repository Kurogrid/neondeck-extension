import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { RADIO_STATIONS, ambientEngine, audioText, closeAudioContext, localPlayer, playSfx, radioPlayer } from './audio';
import { ArasakaBanner } from './components/ArasakaBanner';
import { Chrono } from './components/Chrono';
import { EffectsLayer } from './components/hud/EffectsLayer';
import { HudFrame } from './components/hud/HudFrame';
import { Icon } from './components/Icon';
import { Modal } from './components/Modal';
import { Netlinks } from './components/Netlinks';
import { Quote } from './components/Quote';
import { RadioDeck } from './components/RadioDeck';
import { SearchBar } from './components/SearchBar';
import { SettingsDrawer } from './components/SettingsDrawer';
import { WidgetPanel } from './components/WidgetPanel';
import { t } from './core/i18n';
import { groupNetlinks, shortcutLinks } from './core/netlinks';
import { resolveWallpaper } from './scenes/catalog';
import { ARASAKA_FAN_EMBLEM } from './scenes/overlays';
import { SceneCanvas } from './scenes/SceneCanvas';
import { useSettings, useThemeEngine } from './state';

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

export function App() {
  const { s, update, replace } = useSettings();
  const [drawer, setDrawer] = useState(false);
  const [radioMounted, setRadioMounted] = useState(false);
  const [radioOpen, setRadioOpen] = useState(false);
  const [radioState, setRadioState] = useState(() => radioPlayer.getState());
  const searchRef = useRef<HTMLInputElement>(null);
  useThemeEngine(s);

  useEffect(() => {
    if (RADIO_STATIONS.length === 0) return;
    const unsub = radioPlayer.subscribe(() => setRadioState(radioPlayer.getState()));
    void radioPlayer.hydrate();
    return unsub;
  }, []);

  const groups = useMemo(() => (s ? groupNetlinks(s.netlinks.items, s.netlinks.categoryOrder) : []), [s?.netlinks.items, s?.netlinks.categoryOrder]);
  const shortcuts = useMemo(
    () => (s?.display.showNetlinks ? shortcutLinks(groups, s.netlinks.collapsed) : []),
    [groups, s?.netlinks.collapsed, s?.display.showNetlinks],
  );

  // Global shortcuts: "/" focuses search, 1-9 opens a netlink. Ignored while typing or when a dialog is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      if (e.key === '/' && searchRef.current) { e.preventDefault(); searchRef.current.focus(); return; }
      if (/^[1-9]$/.test(e.key)) {
        const link = shortcuts[Number(e.key) - 1];
        if (link) { e.preventDefault(); window.location.assign(link.url); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [shortcuts]);

  useEffect(() => {
    const onHide = () => {
      ambientEngine.stop();
      localPlayer.stop();
      radioPlayer.persistAndPause();
      closeAudioContext();
    };
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      onHide();
    };
  }, []);

  useEffect(() => {
    if (!s?.audio.uiSfx) return;
    const vol = s.audio.volume;
    const onClick = (e: MouseEvent) => {
      const target = e.target;
      if (target instanceof Element && target.closest('[data-sfx="none"], .nd-dialog--drawer-left .nd-dialog__head .nd-icon-btn, .nd-dialog--drawer-right .nd-dialog__head .nd-icon-btn')) return;
      if (target instanceof HTMLInputElement && target.type === 'checkbox') {
        playSfx('toggle', true, vol);
        return;
      }
      if (
        target instanceof Element &&
        target.closest('.nd-btn, .nd-icon-btn, .nd-card, .nd-theme-card, .nd-wall-card, .nd-custom-del, .nd-seg__btn, .nd-cat__head, .nd-sp__tab, .nd-icon-pick__opt, .nd-amb__tab, .nd-local__play, .nd-radio__link, .nd-radio__station-btn, .nd-radio__playbtn, .nd-radio__mp3btn')
      ) {
        playSfx('click', true, vol);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [s?.audio.uiSfx, s?.audio.volume]);

  if (!s) return <div class="nd-root" aria-busy="true" />;
  const L = s.profile.locale;
  const openDrawer = () => {
    if (s.audio.uiSfx) playSfx('open', true, s.audio.volume);
    setDrawer(true);
  };
  const closeDrawer = () => {
    if (s.audio.uiSfx) playSfx('close', true, s.audio.volume);
    setDrawer(false);
  };
  const openRadio = () => {
    setRadioMounted(true);
    setRadioOpen(true);
  };
  const closeRadio = () => {
    if (s.audio.uiSfx) playSfx('close', true, s.audio.volume);
    setRadioOpen(false);
  };
  const showArasakaBanner =
    ARASAKA_FAN_EMBLEM &&
    !s.display.showSearch &&
    s.theme.id === 'arasaka' &&
    s.background.kind === 'scene' &&
    resolveWallpaper(s.theme.id, s.background.sceneId).id === 'arasaka-mainframe';

  return (
    <div class="nd-root">
      <SceneCanvas
        themeId={s.theme.id}
        background={s.background}
        lowPower={s.theme.lowPower}
      />
      <EffectsLayer vignette={s.background.vignette} />
      <HudFrame />
      <header class="nd-topbar">
        <button type="button" class="nd-btn nd-btn--ghost nd-chamfer" data-sfx="none" onClick={openDrawer} aria-haspopup="dialog" aria-expanded={drawer} title={t(L, 'openSettings')}>
          <Icon name="settings" /> <span>{t(L, 'secIdentity')}</span>
        </button>
        <span class="nd-topbar__sig" aria-hidden="true">NEONDECK // HUD</span>
        <div class="nd-topbar__right">
          {RADIO_STATIONS.length > 0 && (
            <button
              type="button"
              class={`nd-btn nd-btn--ghost nd-chamfer${radioState.playing ? ' nd-btn--radio-live' : ''}`}
              aria-haspopup="dialog"
              aria-expanded={radioOpen}
              title={audioText(L, 'radioTitle')}
              onClick={openRadio}
            >
              <Icon name="radio" /> <span>{audioText(L, 'tabRadio')}</span>
              {radioState.playing && <span class="nd-radio-dot" aria-hidden="true" />}
            </button>
          )}
          <button type="button" class="nd-btn nd-btn--ghost nd-chamfer" aria-pressed={s.display.showWidgets} aria-controls="nd-widgets" title={t(L, 'toggleWidgets')}
            onClick={() => update((d) => { d.display.showWidgets = !d.display.showWidgets; })}>
            <Icon name="widgets" /> <span>{t(L, 'widgets')}</span>
          </button>
        </div>
      </header>
      <div class={`nd-layout ${s.display.showWidgets ? 'nd-layout--widgets' : ''}`}>
      <main class="nd-deck">
        <Chrono s={s} />
        {showArasakaBanner && <ArasakaBanner />}
        {s.display.showSearch && <SearchBar s={s} update={update} inputRef={searchRef} />}
        {s.display.showQuotes && <Quote locale={L} />}
        {s.display.showNetlinks && <Netlinks s={s} update={update} groups={groups} shortcuts={shortcuts} />}
      </main>
      {s.display.showWidgets && <div id="nd-widgets" class="nd-layout__side"><WidgetPanel s={s} update={update} /></div>}
      </div>
      {drawer && (
        <SettingsDrawer
          s={s}
          update={update}
          replace={replace}
          onClose={closeDrawer}
          onOpenRadio={RADIO_STATIONS.length > 0 ? () => { setDrawer(false); openRadio(); } : undefined}
        />
      )}
      {radioMounted && RADIO_STATIONS.length > 0 && (
        <Modal title={audioText(L, 'radioTitle')} closeLabel={t(L, 'close')} onClose={closeRadio} variant="drawer-right" open={radioOpen}>
          <RadioDeck L={L} s={s} update={update} />
        </Modal>
      )}
    </div>
  );
}
