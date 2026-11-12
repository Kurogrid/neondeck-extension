import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../../components/Icon';
import { t } from '../../core/i18n';
import type { WidgetProps } from '../types';
import { PHASES, advance, formatMs, pause, remaining, reset, setPhase, skip, start, type Phase } from './logic';

/**
 * Functional placeholder view. [antigravity] owns the final Pomodoro UI and animations (PLAN Faz 3);
 * keep using the pure functions from ./logic so behaviour and stored state stay compatible.
 */
export function PomodoroView({ L, config, setConfig, editing }: WidgetProps<'pomodoro'>) {
  const [now, setNow] = useState(() => Date.now());
  const [ended, setEnded] = useState<Phase | null>(null);
  const cfgRef = useRef(config);
  cfgRef.current = config;
  const running = config.state.status === 'running';

  // Tick once a second while running and visible; also catch up on phases that ended while the tab was closed.
  useEffect(() => {
    const step = () => {
      const ts = Date.now();
      setNow(ts);
      const r = advance(cfgRef.current, ts);
      if (r.ended.length) { setConfig(r.config); setEnded(r.ended[r.ended.length - 1]!); }
    };
    step();
    if (!running) return;
    const id = setInterval(() => { if (!document.hidden) step(); }, 1000);
    document.addEventListener('visibilitychange', step);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', step); };
  }, [running]);

  const left = remaining(config, now);
  const act = (next: typeof config) => { setEnded(null); setNow(Date.now()); setConfig(next); };
  const { phase, status, completed } = config.state;

  return (
    <div class="nd-pm" data-phase={phase} data-status={status}>
      <div class="nd-pm__phases" role="group" aria-label={t(L, 'w_pomodoro')}>
        {PHASES.map((p) => (
          <button key={p} type="button" class="nd-btn nd-btn--sm nd-btn--ghost" aria-pressed={p === phase} onClick={() => act(setPhase(config, p))}>{t(L, `pm_${p}`)}</button>
        ))}
      </div>
      <p class="nd-pm__time" role="timer" aria-live="off">{formatMs(left)}</p>
      {ended && <p class="nd-note" role="status">{t(L, 'pmEnded', { phase: t(L, `pm_${ended}`) })}</p>}
      <div class="nd-row nd-pm__ctrl">
        {running
          ? <button type="button" class="nd-btn nd-btn--sm" onClick={() => act(pause(config, Date.now()))}><Icon name="pause" /> {t(L, 'pmPause')}</button>
          : <button type="button" class="nd-btn nd-btn--sm nd-btn--primary" onClick={() => act(start(config, Date.now()))}><Icon name="play2" /> {t(L, status === 'paused' ? 'pmResume' : 'pmStart')}</button>}
        <button type="button" class="nd-icon-btn nd-icon-btn--sm" aria-label={t(L, 'pmReset')} title={t(L, 'pmReset')} onClick={() => act(reset(config))}><Icon name="reset" /></button>
        <button type="button" class="nd-icon-btn nd-icon-btn--sm" aria-label={t(L, 'pmSkip')} title={t(L, 'pmSkip')} onClick={() => act(skip(config, Date.now()))}><Icon name="skip" /></button>
      </div>
      <p class="nd-hint">{t(L, 'pmCompleted', { n: completed })}</p>
      {editing && <div class="nd-pm__opts">
        <div class="nd-pm__mins">
          {PHASES.map((p) => (
            <label key={p} class="nd-field">{t(L, 'pmMinutes', { phase: t(L, `pm_${p}`) })}
              <input type="number" min={1} max={p === 'work' ? 180 : 90} value={config.minutes[p]}
                onChange={(e) => {
                  const v = Math.round(Number(e.currentTarget.value));
                  if (!Number.isFinite(v) || v < 1) return;
                  const next = { ...config, minutes: { ...config.minutes, [p]: Math.min(v, p === 'work' ? 180 : 90) } };
                  act(status === 'idle' && phase === p ? reset(next) : next);
                }} />
            </label>
          ))}
        </div>
        <label class="nd-check"><input type="checkbox" checked={config.autoStart} onChange={() => act({ ...config, autoStart: !config.autoStart })} /> {t(L, 'pmAutoStart')}</label>
        <p class="nd-hint">{t(L, 'pmTabNote')}</p>
      </div>}
    </div>
  );
}
