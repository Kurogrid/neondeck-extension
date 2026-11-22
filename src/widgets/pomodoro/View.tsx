import { useEffect, useRef, useState } from 'preact/hooks';
import { playSfx } from '../../audio';
import { Icon } from '../../components/Icon';
import { t } from '../../core/i18n';
import type { WidgetProps } from '../types';
import {
  PHASES, advance, formatMs, pause, phaseMs, remaining, reset, setPhase, skip, start,
  type Phase,
} from './logic';

const DIAL_R = 56;
const CIRCUMFERENCE = 2 * Math.PI * DIAL_R;

const maxMinutes = (p: Phase) => (p === 'work' ? 180 : p === 'short' ? 60 : 90);

export function PomodoroView({ L, s, config, setConfig, editing }: WidgetProps<'pomodoro'>) {
  const [now, setNow] = useState(() => Date.now());
  const [ended, setEnded] = useState<Phase | null>(null);
  const cfgRef = useRef(config);
  cfgRef.current = config;
  const sRef = useRef(s);
  sRef.current = s;
  const running = config.state.status === 'running';

  // Tick twice a second while visible and catch up on phases completed while closed.
  useEffect(() => {
    const step = (fromLiveTick: boolean) => {
      const ts = Date.now();
      setNow(ts);
      const r = advance(cfgRef.current, ts);
      if (r.ended.length) {
        setConfig(r.config);
        setEnded(r.ended[r.ended.length - 1] ?? null);
        if (fromLiveTick) playSfx('complete', sRef.current.audio.uiSfx, sRef.current.audio.volume);
      }
    };
    step(false);
    if (!running) return;
    const id = setInterval(() => {
      if (!document.hidden) step(true);
    }, 500);
    const onVis = () => {
      if (!document.hidden) step(false);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [running]);

  const { phase, status, completed } = config.state;
  const left = remaining(config, now);
  const total = Math.max(1, phaseMs(config, phase));
  const ratio = Math.max(0, Math.min(1, left / total));
  const dashOffset = Number((CIRCUMFERENCE * (1 - ratio)).toFixed(2));
  const mod = completed % config.longEvery;
  const litPips = completed > 0 && mod === 0 && phase === 'long' ? config.longEvery : mod;

  const act = (next: typeof config) => {
    setEnded(null);
    setNow(Date.now());
    setConfig(next);
  };

  return (
    <div class="nd-pm" data-phase={phase} data-status={status}>
      <div class="nd-pm__phases" role="group" aria-label={t(L, 'w_pomodoro')}>
        {PHASES.map((p) => (
          <button
            key={p}
            type="button"
            class="nd-btn nd-btn--sm nd-btn--ghost"
            aria-pressed={p === phase}
            onClick={() => act(setPhase(config, p))}
          >
            {t(L, `pm_${p}`)}
          </button>
        ))}
      </div>

      <div class="nd-pm__dial">
        <svg class="nd-pm__ring" viewBox="0 0 148 148" width={148} height={148} aria-hidden="true" focusable="false">
          <circle class="nd-pm__ticks" cx="74" cy="74" r="66" />
          <path class="nd-pm__reticle" d="M74 2v7M74 139v7M2 74h7M139 74h7" />
          <circle class="nd-pm__track" cx="74" cy="74" r={DIAL_R} />
          <circle
            class="nd-pm__arc"
            cx="74"
            cy="74"
            r={DIAL_R}
            stroke-dasharray={CIRCUMFERENCE.toFixed(2)}
            stroke-dashoffset={dashOffset}
            transform="rotate(-90 74 74)"
          />
        </svg>
        <div class="nd-pm__readout">
          <span class="nd-pm__phase">{t(L, `pm_${phase}`)}</span>
          <p class="nd-pm__time" role="timer" aria-live="off">{formatMs(left)}</p>
          <span class="nd-pm__status-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
      </div>

      {ended && <p class="nd-note nd-pm__ended" role="status">{t(L, 'pmEnded', { phase: t(L, `pm_${ended}`) })}</p>}

      <div class="nd-row nd-pm__ctrl">
        {running ? (
          <button type="button" class="nd-btn nd-btn--sm nd-chamfer" onClick={() => act(pause(config, Date.now()))}>
            <Icon name="pause" size={14} /> {t(L, 'pmPause')}
          </button>
        ) : (
          <button type="button" class="nd-btn nd-btn--sm nd-btn--primary nd-chamfer" onClick={() => act(start(config, Date.now()))}>
            <Icon name="play2" size={14} /> {t(L, status === 'paused' ? 'pmResume' : 'pmStart')}
          </button>
        )}
        <button type="button" class="nd-icon-btn nd-icon-btn--sm" aria-label={t(L, 'pmReset')} title={t(L, 'pmReset')} onClick={() => act(reset(config))}>
          <Icon name="reset" />
        </button>
        <button type="button" class="nd-icon-btn nd-icon-btn--sm" aria-label={t(L, 'pmSkip')} title={t(L, 'pmSkip')} onClick={() => act(skip(config, Date.now()))}>
          <Icon name="skip" />
        </button>
      </div>

      <div class="nd-pm__cycle">
        <div class="nd-pm__pips" aria-hidden="true">
          {Array.from({ length: config.longEvery }, (_, idx) => (
            <span key={idx} class={`nd-pm__pip${idx < litPips ? ' is-lit' : ''}`} />
          ))}
        </div>
        <p class="nd-hint">{t(L, 'pmCompleted', { n: completed })}</p>
      </div>

      {editing && (
        <div class="nd-pm__opts">
          <div class="nd-pm__mins">
            {PHASES.map((p) => (
              <label key={p} class="nd-field">
                {t(L, 'pmMinutes', { phase: t(L, `pm_${p}`) })}
                <input
                  type="number"
                  min={1}
                  max={maxMinutes(p)}
                  value={config.minutes[p]}
                  onChange={(e) => {
                    const v = Math.round(Number(e.currentTarget.value));
                    if (!Number.isFinite(v) || v < 1) return;
                    const next = { ...config, minutes: { ...config.minutes, [p]: Math.min(v, maxMinutes(p)) } };
                    act(status === 'idle' && phase === p ? reset(next) : next);
                  }}
                />
              </label>
            ))}
          </div>
          <label class="nd-check">
            <input type="checkbox" checked={config.autoStart} onChange={() => act({ ...config, autoStart: !config.autoStart })} />
            {t(L, 'pmAutoStart')}
          </label>
          <p class="nd-hint">{t(L, 'pmTabNote')}</p>
        </div>
      )}
    </div>
  );
}
