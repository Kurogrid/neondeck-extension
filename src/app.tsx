import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Chrono } from './components/Chrono';
import { Icon } from './components/Icon';
import { Netlinks } from './components/Netlinks';
import { Quote } from './components/Quote';
import { SearchBar } from './components/SearchBar';
import { SettingsDrawer } from './components/SettingsDrawer';
import { WidgetPanel } from './components/WidgetPanel';
import { t } from './core/i18n';
import { groupNetlinks, shortcutLinks } from './core/netlinks';
import { useSettings, useThemeEngine } from './state';

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

export function App() {
  const { s, update, replace } = useSettings();
  const [drawer, setDrawer] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  useThemeEngine(s);

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

  if (!s) return <div class="nd-root" aria-busy="true" />;
  const L = s.profile.locale;

  return (
    <div class="nd-root">
      <header class="nd-topbar">
        <button type="button" class="nd-btn nd-btn--ghost nd-chamfer" onClick={() => setDrawer(true)} aria-haspopup="dialog" aria-expanded={drawer} title={t(L, 'openSettings')}>
          <Icon name="settings" /> <span>{t(L, 'secIdentity')}</span>
        </button>
        <button type="button" class="nd-btn nd-btn--ghost nd-chamfer" aria-pressed={s.display.showWidgets} aria-controls="nd-widgets" title={t(L, 'toggleWidgets')}
          onClick={() => update((d) => { d.display.showWidgets = !d.display.showWidgets; })}>
          <Icon name="widgets" /> <span>{t(L, 'widgets')}</span>
        </button>
      </header>
      <div class={`nd-layout ${s.display.showWidgets ? 'nd-layout--widgets' : ''}`}>
      <main class="nd-deck">
        <Chrono s={s} />
        {s.display.showSearch && <SearchBar s={s} update={update} inputRef={searchRef} />}
        {s.display.showQuotes && <Quote locale={L} />}
        {s.display.showNetlinks && <Netlinks s={s} update={update} groups={groups} shortcuts={shortcuts} />}
      </main>
      {s.display.showWidgets && <div id="nd-widgets" class="nd-layout__side"><WidgetPanel s={s} update={update} /></div>}
      </div>
      {drawer && <SettingsDrawer s={s} update={update} replace={replace} onClose={() => setDrawer(false)} />}
    </div>
  );
}
