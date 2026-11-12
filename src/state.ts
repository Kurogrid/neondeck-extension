import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { Settings } from './core/schema';
import { loadSettings, saveSettings, subscribeSettings } from './core/storage';
import { applyTheme } from './core/theme-engine';

export type Update = (mutate: (draft: Settings) => void) => void;
export interface SettingsStore { s: Settings | null; update: Update; replace: (next: Settings) => void }

const SAVE_DELAY_MS = 250;

/** Single source of truth for settings: debounced persistence + live sync from other tabs. */
export function useSettings(): SettingsStore {
  const [s, setS] = useState<Settings | null>(null);
  const current = useRef<Settings | null>(null);
  const pending = useRef<Settings | null>(null);
  const lastWritten = useRef('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    lastWritten.current = JSON.stringify(p);
    void saveSettings(p);
  }, []);

  const commit = useCallback((next: Settings, immediate: boolean) => {
    current.current = next;
    setS(next);
    pending.current = next;
    clearTimeout(timer.current);
    if (immediate) flush();
    else timer.current = setTimeout(flush, SAVE_DELAY_MS);
  }, [flush]);

  useEffect(() => {
    let alive = true;
    void loadSettings().then((v) => {
      if (alive && !current.current) { current.current = v; setS(v); }
    });
    const unsub = subscribeSettings((next, raw) => {
      // Ignore echoes of our own writes and don't clobber unsaved local edits.
      if (raw === lastWritten.current || pending.current) return;
      current.current = next;
      setS(next);
    });
    window.addEventListener('pagehide', flush);
    return () => { alive = false; unsub(); window.removeEventListener('pagehide', flush); flush(); };
  }, [flush]);

  const update = useCallback<Update>((mutate) => {
    if (!current.current) return;
    const next = structuredClone(current.current);
    mutate(next);
    commit(next, false);
  }, [commit]);

  const replace = useCallback((next: Settings) => commit(next, true), [commit]);
  return { s, update, replace };
}

export function useThemeEngine(s: Settings | null): void {
  useEffect(() => {
    if (!s) return;
    applyTheme(document.documentElement, s);
    document.title = s.tab.title;
  }, [s?.theme, s?.profile.locale, s?.tab.title]);
}
