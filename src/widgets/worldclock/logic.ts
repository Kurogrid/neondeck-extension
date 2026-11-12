import { bool, isObj, str } from '../../core/guards';

export interface Zone { id: string; label: string; tz: string }
export interface WorldClockConfig { zones: Zone[]; showDate: boolean }

export const MAX_ZONES = 8;

/** A few well-known cities, used to map imported locations (which have no time zone) and as defaults. */
const CITY_TZ: Record<string, string> = {
  tokyo: 'Asia/Tokyo', seoul: 'Asia/Seoul', shanghai: 'Asia/Shanghai', beijing: 'Asia/Shanghai', 'hong kong': 'Asia/Hong_Kong',
  singapore: 'Asia/Singapore', dubai: 'Asia/Dubai', mumbai: 'Asia/Kolkata', delhi: 'Asia/Kolkata', istanbul: 'Europe/Istanbul',
  ankara: 'Europe/Istanbul', izmir: 'Europe/Istanbul', moscow: 'Europe/Moscow', berlin: 'Europe/Berlin', paris: 'Europe/Paris',
  london: 'Europe/London', amsterdam: 'Europe/Amsterdam', madrid: 'Europe/Madrid', rome: 'Europe/Rome', 'new york': 'America/New_York',
  chicago: 'America/Chicago', denver: 'America/Denver', 'los angeles': 'America/Los_Angeles', 'san francisco': 'America/Los_Angeles',
  'night city': 'America/Los_Angeles', toronto: 'America/Toronto', 'mexico city': 'America/Mexico_City', 'sao paulo': 'America/Sao_Paulo',
  sydney: 'Australia/Sydney', auckland: 'Pacific/Auckland', cairo: 'Africa/Cairo', lagos: 'Africa/Lagos', utc: 'UTC',
};

export const isValidTz = (tz: string) => {
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch { return false; }
};

/** "America/New_York" -> "New York" */
export const labelFromTz = (tz: string) => (tz.split('/').pop() ?? tz).replace(/_/g, ' ');

export const cityToTz = (name: string): string | null => CITY_TZ[name.trim().toLowerCase().split(',')[0]!.trim()] ?? null;

export const defaultZones = (): Zone[] => [
  { id: 'z-tokyo', label: 'Tokyo', tz: 'Asia/Tokyo' },
  { id: 'z-london', label: 'London', tz: 'Europe/London' },
  { id: 'z-newyork', label: 'New York', tz: 'America/New_York' },
];

export function cleanWorldClockConfig(v: unknown): WorldClockConfig {
  const o = isObj(v) ? v : {};
  const zones: Zone[] = [];
  const add = (label: string, tz: string, id?: string) => {
    if (zones.length >= MAX_ZONES || !isValidTz(tz) || zones.some((z) => z.tz === tz && z.label === label)) return;
    zones.push({ id: id || `z-${zones.length}-${tz.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, label: label || labelFromTz(tz), tz });
  };
  if (Array.isArray(o.zones)) {
    for (const z of o.zones) if (isObj(z)) add(str(z.label, 40, ''), str(z.tz, 64, ''), str(z.id, 40, ''));
  } else if (isObj(o.location)) {
    // Cyberstart format: a single geo location without a time zone.
    const name = str(o.location.name, 80, '');
    const tz = cityToTz(name);
    if (tz) add(name.split(',')[0]!.trim(), tz);
  }
  return { zones: Array.isArray(o.zones) || zones.length ? zones : defaultZones(), showDate: bool(o.showDate, true) };
}

export interface ZoneTime { time: string; date: string; offset: string; dayShift: -1 | 0 | 1 }

/** Wall time in `tz`, plus whether that zone is a day ahead / behind the local date. */
export function zoneTime(now: Date, tz: string, locale: string, hour12: boolean): ZoneTime {
  const time = new Intl.DateTimeFormat(locale, { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12 }).format(now);
  const date = new Intl.DateTimeFormat(locale, { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' }).format(now);
  const offset = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' })
    .formatToParts(now).find((p) => p.type === 'timeZoneName')?.value ?? '';
  const ymd = (zone?: string) => new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const there = ymd(tz);
  const here = ymd(undefined);
  return { time, date, offset, dayShift: there === here ? 0 : there > here ? 1 : -1 };
}

/** All IANA zones the browser knows (for the add-zone picker). */
export const allTimeZones = (): string[] => {
  try { return Intl.supportedValuesOf('timeZone'); } catch { return Object.values(CITY_TZ); }
};
