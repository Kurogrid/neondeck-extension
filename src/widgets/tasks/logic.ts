import { bool, isObj, str } from '../../core/guards';

export interface Task { id: string; text: string; done: boolean }
export interface Habit { id: string; name: string; days: string[] }
export interface TasksConfig { tasks: Task[]; habits: Habit[] }

export const MAX_TASKS = 200;
export const MAX_HABITS = 20;
/** Habit history kept per habit (enough for streaks and a short heatmap). */
export const HABIT_HISTORY_DAYS = 120;

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const shortId = (p: string) => `${p}-${crypto.randomUUID().slice(0, 8)}`;

/** Local calendar day as YYYY-MM-DD. */
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export function cleanTasksConfig(v: unknown): TasksConfig {
  const o = isObj(v) ? v : {};
  const ids = new Set<string>();
  const uid = (raw: unknown, p: string) => {
    let id = str(raw, 40, '') || shortId(p);
    while (ids.has(id)) id = shortId(p);
    ids.add(id);
    return id;
  };
  const tasks: Task[] = [];
  for (const t of Array.isArray(o.tasks) ? o.tasks.slice(0, MAX_TASKS) : []) {
    if (!isObj(t)) continue;
    // Cyberstart tasks may use `title`/`completed`.
    const text = str(t.text ?? t.title, 200, '');
    if (text) tasks.push({ id: uid(t.id, 't'), text, done: bool(t.done ?? t.completed, false) });
  }
  const habits: Habit[] = [];
  for (const h of Array.isArray(o.habits) ? o.habits.slice(0, MAX_HABITS) : []) {
    if (!isObj(h)) continue;
    const name = str(h.name, 60, '');
    if (!name) continue;
    const days = Array.isArray(h.days) ? [...new Set(h.days.filter((d): d is string => typeof d === 'string' && DAY_RE.test(d)))].sort().slice(-HABIT_HISTORY_DAYS) : [];
    habits.push({ id: uid(h.id, 'h'), name, days });
  }
  return { tasks, habits };
}

export const newTask = (text: string): Task => ({ id: shortId('t'), text: text.trim().slice(0, 200), done: false });
export const newHabit = (name: string): Habit => ({ id: shortId('h'), name: name.trim().slice(0, 60), days: [] });

export function toggleHabitDay(h: Habit, day: string): Habit {
  const days = h.days.includes(day) ? h.days.filter((d) => d !== day) : [...h.days, day].sort().slice(-HABIT_HISTORY_DAYS);
  return { ...h, days };
}

/**
 * Consecutive days done, ending today. If today is not done yet, the streak ending
 * yesterday still counts (it is not broken until the day is over).
 */
export function streak(days: string[], today: Date): number {
  const set = new Set(days);
  let cursor = set.has(dayKey(today)) ? today : addDays(today, -1);
  let count = 0;
  while (set.has(dayKey(cursor))) { count++; cursor = addDays(cursor, -1); }
  return count;
}

/** The last `n` days (oldest first) with done flags, for a small history strip. */
export const lastDays = (h: Habit, today: Date, n = 7) =>
  Array.from({ length: n }, (_, i) => { const k = dayKey(addDays(today, i - n + 1)); return { day: k, done: h.days.includes(k) }; });
