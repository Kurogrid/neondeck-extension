import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { hasPerm, onPermsChanged, permsAvailable, requestPerm, revokePerm, type OptionalPerm } from './core/permissions';

/** Current time, re-rendered on each minute boundary (and when the tab becomes visible again). */
export function useMinute(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      const d = new Date();
      setNow(d);
      id = setTimeout(tick, 60_000 - d.getSeconds() * 1000 - d.getMilliseconds() + 25);
    };
    const onVis = () => { if (!document.hidden) { clearTimeout(id); tick(); } };
    id = setTimeout(tick, 60_000 - now.getSeconds() * 1000 - now.getMilliseconds() + 25);
    document.addEventListener('visibilitychange', onVis);
    return () => { clearTimeout(id); document.removeEventListener('visibilitychange', onVis); };
  }, []);
  return now;
}

export interface PermissionState { available: boolean; granted: boolean; request: () => Promise<boolean>; revoke: () => Promise<boolean> }

export function usePermission(p: OptionalPerm): PermissionState {
  const [granted, setGranted] = useState(false);
  const available = permsAvailable();
  useEffect(() => {
    const refresh = () => { void hasPerm(p).then(setGranted); };
    refresh();
    return onPermsChanged(refresh);
  }, [p]);
  const request = useCallback(async () => { const ok = await requestPerm(p); setGranted(ok || (await hasPerm(p))); return ok; }, [p]);
  const revoke = useCallback(async () => { const ok = await revokePerm(p); setGranted(await hasPerm(p)); return ok; }, [p]);
  return { available, granted, request, revoke };
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Modal behaviour: Escape closes, Tab is trapped inside, focus is restored on close. */
export function useDialog<T extends HTMLElement>(onClose: () => void, active = true) {
  const ref = useRef<T>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!active) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    (el?.querySelector<HTMLElement>('[data-autofocus]') ?? el?.querySelector<HTMLElement>(FOCUSABLE))?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (!el) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close.current(); return; }
      if (e.key !== 'Tab') return;
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      const current = document.activeElement as HTMLElement | null;
      // Focus outside the dialog (e.g. Tab pressed before the initial focus landed): pull it back in.
      if (!current || !el.contains(current)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => { document.removeEventListener('keydown', onKey, true); prev?.focus?.(); };
  }, [active]);
  return ref;
}
