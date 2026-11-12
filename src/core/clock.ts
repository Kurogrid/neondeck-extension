import type { Locale } from './schema';

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

export function dayPart(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

const TAG: Record<Locale, string> = { en: 'en-US', tr: 'tr-TR' };

export interface ClockParts { hours: string; minutes: string; period: string }

export function clockParts(d: Date, locale: Locale, fmt: '12h' | '24h'): ClockParts {
  const parts = new Intl.DateTimeFormat(TAG[locale], { hour: '2-digit', minute: '2-digit', hourCycle: fmt === '24h' ? 'h23' : 'h12' }).formatToParts(d);
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? '';
  return { hours: get('hour').padStart(2, '0'), minutes: get('minute'), period: fmt === '12h' ? get('dayPeriod') : '' };
}

export const formatDate = (d: Date, locale: Locale) =>
  new Intl.DateTimeFormat(TAG[locale], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(d);
