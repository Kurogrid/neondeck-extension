import { bool, isObj, num, oneOf } from '../../core/guards';

/**
 * Pomodoro logic. Timestamp based, no `chrome.alarms`: the timer only
 * advances while a NEONDECK tab is open, but closing and reopening the tab loses nothing
 * because state is stored as an absolute end time. The view is a separate layer.
 */
export const PHASES = ['work', 'short', 'long'] as const;
export type Phase = (typeof PHASES)[number];
export type Status = 'idle' | 'running' | 'paused';

export interface PomodoroState { phase: Phase; status: Status; endsAt: number; remainingMs: number; completed: number }
export interface PomodoroConfig {
  minutes: Record<Phase, number>;
  /** A long break follows every N work sessions. */
  longEvery: number;
  /** Start the next phase automatically when one ends. */
  autoStart: boolean;
  state: PomodoroState;
}

const MIN = 60_000;
export const phaseMs = (c: PomodoroConfig, p: Phase) => c.minutes[p] * MIN;

export function cleanPomodoroConfig(v: unknown): PomodoroConfig {
  const o = isObj(v) ? v : {};
  const m = isObj(o.minutes) ? o.minutes : {};
  const minutes = { work: num(m.work, 1, 180, 25), short: num(m.short, 1, 60, 5), long: num(m.long, 1, 90, 15) };
  const s = isObj(o.state) ? o.state : {};
  const phase = oneOf(s.phase, PHASES, 'work');
  const status = oneOf(s.status, ['idle', 'running', 'paused'] as const, 'idle');
  const full = minutes[phase] * MIN;
  const state: PomodoroState = {
    phase, status,
    endsAt: status === 'running' ? num(s.endsAt, 0, 8.64e15, 0) : 0,
    remainingMs: status === 'idle' ? full : num(s.remainingMs, 0, full, full),
    completed: Math.floor(num(s.completed, 0, 10_000, 0)),
  };
  if (state.status === 'running' && !state.endsAt) { state.status = 'idle'; state.remainingMs = full; }
  return { minutes, longEvery: Math.floor(num(o.longEvery, 2, 12, 4)), autoStart: bool(o.autoStart, false), state };
}

export const nextPhase = (c: PomodoroConfig, completedWork: number, from: Phase): Phase =>
  from !== 'work' ? 'work' : completedWork % c.longEvery === 0 ? 'long' : 'short';

/** Milliseconds left at `now`. */
export const remaining = (c: PomodoroConfig, now: number) =>
  c.state.status === 'running' ? Math.max(0, c.state.endsAt - now) : c.state.remainingMs;

export function start(c: PomodoroConfig, now: number): PomodoroConfig {
  if (c.state.status === 'running') return c;
  return { ...c, state: { ...c.state, status: 'running', endsAt: now + c.state.remainingMs } };
}

export function pause(c: PomodoroConfig, now: number): PomodoroConfig {
  if (c.state.status !== 'running') return c;
  return { ...c, state: { ...c.state, status: 'paused', endsAt: 0, remainingMs: Math.max(0, c.state.endsAt - now) } };
}

/** Back to the start of the current phase. */
export const reset = (c: PomodoroConfig): PomodoroConfig =>
  ({ ...c, state: { ...c.state, status: 'idle', endsAt: 0, remainingMs: phaseMs(c, c.state.phase) } });

/** Choose a phase by hand (stops the timer). */
export const setPhase = (c: PomodoroConfig, phase: Phase): PomodoroConfig =>
  ({ ...c, state: { ...c.state, phase, status: 'idle', endsAt: 0, remainingMs: phaseMs(c, phase) } });

function finishPhase(c: PomodoroConfig, endedAt: number): PomodoroConfig {
  const completed = c.state.completed + (c.state.phase === 'work' ? 1 : 0);
  const phase = nextPhase(c, completed, c.state.phase);
  const full = phaseMs(c, phase);
  return c.autoStart
    ? { ...c, state: { phase, status: 'running', endsAt: endedAt + full, remainingMs: full, completed } }
    : { ...c, state: { phase, status: 'idle', endsAt: 0, remainingMs: full, completed } };
}

/** Skip to the next phase now (a skipped work session is not counted). */
export function skip(c: PomodoroConfig, now: number): PomodoroConfig {
  const next = setPhase(c, c.state.phase === 'work' ? 'short' : 'work');
  return c.autoStart ? start(next, now) : next;
}

/**
 * Applies every phase end that happened before `now` (e.g. after the tab was closed).
 * Returns the new config and the phases that just ended, so the UI can notify once.
 */
export function advance(c: PomodoroConfig, now: number): { config: PomodoroConfig; ended: Phase[] } {
  const ended: Phase[] = [];
  let cur = c;
  // Cap the loop: with autoStart a tab closed for days must not spin forever.
  for (let i = 0; i < 50 && cur.state.status === 'running' && cur.state.endsAt <= now; i++) {
    ended.push(cur.state.phase);
    cur = finishPhase(cur, cur.state.endsAt);
  }
  if (cur.state.status === 'running' && cur.state.endsAt <= now) cur = reset(cur);
  return { config: cur, ended };
}

/** mm:ss */
export const formatMs = (ms: number) => {
  const total = Math.ceil(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
