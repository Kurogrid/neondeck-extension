import { describe, expect, it } from 'vitest';
import { defaultAiLinks, cleanAiLinksConfig } from './ailinks/logic';
import { cleanWidgetConfig } from './configs';
import { moveWidget, moveWidgetBy } from './order';
import { advance, cleanPomodoroConfig, formatMs, pause, remaining, reset, skip, start } from './pomodoro/logic';
import { MAX_TOTAL_CHARS, cleanScratchpadConfig, setNoteContent } from './scratchpad/logic';
import { cleanTasksConfig, dayKey, lastDays, streak, toggleHabitDay } from './tasks/logic';
import { cleanWeatherConfig, forecastUrl, isFresh, parseForecast, parseGeocode, weatherKind, CACHE_TTL_MS } from './weather/logic';
import { cleanWorldClockConfig, labelFromTz, zoneTime } from './worldclock/logic';

const MIN = 60_000;

describe('weather', () => {
  it('cleans config and rejects bad coordinates', () => {
    expect(cleanWeatherConfig({ location: { name: 'X', latitude: 999, longitude: 0 }, unit: 'k' })).toEqual({ location: null, unit: 'c' });
    expect(cleanWeatherConfig({ location: { name: 'Izmir', latitude: 38.42, longitude: 27.14 }, unit: 'f' }).location?.name).toBe('Izmir');
  });
  it('sends only rounded coordinates', () => {
    const url = new URL(forecastUrl({ name: 'Secret Street 5', latitude: 38.423734, longitude: 27.142826 }, 'f'));
    expect(url.host).toBe('api.open-meteo.com');
    expect(url.searchParams.get('latitude')).toBe('38.42');
    expect(url.searchParams.get('temperature_unit')).toBe('fahrenheit');
    expect(url.toString()).not.toContain('Secret');
  });
  it('parses forecast and geocoding payloads defensively', () => {
    const d = parseForecast({ current: { temperature_2m: 21.4, weather_code: 61, wind_speed_10m: 12, relative_humidity_2m: 70, is_day: 1 }, daily: { temperature_2m_max: [24], temperature_2m_min: [15] } }, 1000);
    expect(d).toMatchObject({ temp: 21.4, code: 61, max: 24, min: 15, isDay: true, fetchedAt: 1000 });
    expect(parseForecast({ current: { temperature_2m: 'hot' } }, 0)).toBeNull();
    expect(parseForecast(null, 0)).toBeNull();
    expect(parseGeocode({ results: [{ name: 'İzmir', admin1: 'İzmir', country: 'Türkiye', latitude: 38.4, longitude: 27.1 }, { name: 'bad' }] }))
      .toEqual([{ name: 'İzmir, Türkiye', latitude: 38.4, longitude: 27.1 }]);
  });
  it('maps WMO codes and cache freshness', () => {
    expect([0, 2, 3, 45, 53, 63, 81, 73, 95].map(weatherKind)).toEqual(['clear', 'partly', 'cloudy', 'fog', 'drizzle', 'rain', 'rain', 'snow', 'storm']);
    const d = parseForecast({ current: { temperature_2m: 1, weather_code: 0 } }, 0)!;
    expect(isFresh(d, CACHE_TTL_MS - 1)).toBe(true);
    expect(isFresh(d, CACHE_TTL_MS)).toBe(false);
  });
});

describe('world clock', () => {
  it('maps the Cyberstart location to a time zone and drops invalid zones', () => {
    expect(cleanWorldClockConfig({ location: { name: 'Tokyo', latitude: 35.6, longitude: 139.6 }, showDate: true }).zones)
      .toEqual([expect.objectContaining({ label: 'Tokyo', tz: 'Asia/Tokyo' })]);
    expect(cleanWorldClockConfig({ zones: [{ label: 'X', tz: 'Mars/Olympus' }, { label: '', tz: 'Europe/Istanbul' }] }).zones.map((z) => z.label)).toEqual(['Istanbul']);
    expect(cleanWorldClockConfig({ zones: [] }).zones).toEqual([]);
    expect(cleanWorldClockConfig(undefined).zones.length).toBe(3);
    expect(labelFromTz('America/New_York')).toBe('New York');
  });
  it('formats time in another zone', () => {
    const z = zoneTime(new Date('2026-01-01T23:30:00Z'), 'Asia/Tokyo', 'en', false);
    expect(z.time).toBe('08:30');
    expect(z.offset).toBe('GMT+9');
  });
});

describe('scratchpad', () => {
  it('converts a single Cyberstart note and keeps the size budget', () => {
    const c = cleanScratchpadConfig({ content: 'hello' });
    expect(c.notes).toEqual([{ id: 'n-1', title: '#1', content: 'hello' }]);
    const big = cleanScratchpadConfig({ notes: [{ id: 'a', title: 'A', content: 'x'.repeat(MAX_TOTAL_CHARS) }, { id: 'b', title: 'B', content: 'more' }], active: 'b' });
    expect(big.notes[1]!.content).toBe('');
    expect(big.active).toBe('b');
    expect(setNoteContent(big, 'b', 'yyy').notes[1]!.content).toBe('');
    expect(setNoteContent(big, 'a', 'short').notes[0]!.content).toBe('short');
  });
});

describe('tasks & habits', () => {
  const today = new Date(2026, 10, 12, 10);
  it('cleans tasks (incl. Cyberstart field names) and habit days', () => {
    const c = cleanTasksConfig({ tasks: [{ id: '1', title: 'Old', completed: true }, { text: '' }, 'x'], habits: [{ id: 'h', name: 'Run', days: ['2026-11-11', 'bad', '2026-11-11'] }] });
    expect(c.tasks).toEqual([{ id: '1', text: 'Old', done: true }]);
    expect(c.habits[0]!.days).toEqual(['2026-11-11']);
  });
  it('counts streaks ending today or (if today is open) yesterday', () => {
    expect(streak(['2026-11-10', '2026-11-11'], today)).toBe(2);
    expect(streak(['2026-11-10', '2026-11-11', '2026-11-12'], today)).toBe(3);
    expect(streak(['2026-11-09'], today)).toBe(0);
    expect(dayKey(today)).toBe('2026-11-12');
  });
  it('toggles a day and builds the 7-day strip', () => {
    const h = toggleHabitDay({ id: 'h', name: 'Run', days: [] }, '2026-11-12');
    expect(h.days).toEqual(['2026-11-12']);
    expect(toggleHabitDay(h, '2026-11-12').days).toEqual([]);
    const strip = lastDays(h, today);
    expect(strip).toHaveLength(7);
    expect(strip.at(-1)).toEqual({ day: '2026-11-12', done: true });
  });
});

describe('AI links', () => {
  it('defaults to Claude/Gemini/ChatGPT and drops unsafe urls', () => {
    expect(cleanAiLinksConfig(undefined).links).toEqual(defaultAiLinks());
    expect(cleanAiLinksConfig({ links: [{ name: 'X', url: 'javascript:alert(1)' }, { name: 'Y', url: 'https://y.example' }] }).links.map((l) => l.name)).toEqual(['Y']);
  });
});

describe('pomodoro', () => {
  const base = cleanPomodoroConfig({ minutes: { work: 25, short: 5, long: 15 }, longEvery: 2 });
  it('starts, pauses and resumes from timestamps', () => {
    let c = start(base, 0);
    expect(remaining(c, 10 * MIN)).toBe(15 * MIN);
    c = pause(c, 10 * MIN);
    expect(c.state).toMatchObject({ status: 'paused', remainingMs: 15 * MIN });
    expect(remaining(c, 99 * MIN)).toBe(15 * MIN);
    c = start(c, 100 * MIN);
    expect(c.state.endsAt).toBe(115 * MIN);
  });
  it('advances phases (long break every N) and stops without auto-start', () => {
    let r = advance(start(base, 0), 25 * MIN);
    expect(r.ended).toEqual(['work']);
    expect(r.config.state).toMatchObject({ phase: 'short', status: 'idle', completed: 1 });
    r = advance(start(r.config, 30 * MIN), 35 * MIN);
    expect(r.config.state.phase).toBe('work');
    r = advance(start(r.config, 40 * MIN), 65 * MIN);
    expect(r.config.state).toMatchObject({ phase: 'long', completed: 2 });
  });
  it('catches up on several phases when auto-start is on (tab was closed)', () => {
    const r = advance(start({ ...base, autoStart: true }, 0), 31 * MIN);
    expect(r.ended).toEqual(['work', 'short']);
    expect(r.config.state).toMatchObject({ phase: 'work', status: 'running', endsAt: 55 * MIN });
  });
  it('skip and reset, plus sanitizing broken state', () => {
    expect(skip(base, 0).state.phase).toBe('short');
    expect(reset(start(base, 0)).state).toMatchObject({ status: 'idle', remainingMs: 25 * MIN });
    expect(cleanPomodoroConfig({ state: { status: 'running' } }).state.status).toBe('idle');
    expect(cleanPomodoroConfig({ minutes: { work: -5 } }).minutes.work).toBe(1);
    expect(formatMs(25 * MIN)).toBe('25:00');
    expect(formatMs(61_001)).toBe('01:02');
  });
  it('every widget type has a config cleaner', () => {
    for (const type of ['weather', 'worldclock', 'scratchpad', 'tasks', 'pomodoro', 'ambient', 'ailinks'] as const) expect(cleanWidgetConfig(type, 'garbage')).toBeTypeOf('object');
  });
});

describe('widget order', () => {
  const ws = (ids: string, enabled = 'abcd') => ids.split('').map((id, i) => ({ id, type: 'weather' as const, enabled: enabled.includes(id), order: i }));
  const ids = (l: { id: string; order: number }[]) => [...l].sort((a, b) => a.order - b.order).map((w) => w.id).join('');
  it('drag & drop moves a widget to the target slot', () => {
    expect(ids(moveWidget(ws('abcd'), 'a', 'c'))).toBe('bcad');
    expect(ids(moveWidget(ws('abcd'), 'd', 'a'))).toBe('dabc');
    expect(ids(moveWidget(ws('abcd'), 'x', 'a'))).toBe('abcd');
  });
  it('arrow moves skip hidden widgets when asked', () => {
    const l = ws('abcd', 'ad');
    expect(ids(moveWidgetBy(l, 'd', -1, (w) => w.enabled))).toBe('dabc');
    expect(ids(moveWidgetBy(l, 'a', -1, (w) => w.enabled))).toBe('abcd');
    expect(ids(moveWidgetBy(ws('abcd'), 'b', 1))).toBe('acbd');
  });
});
