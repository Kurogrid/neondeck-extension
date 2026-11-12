import { isObj, oneOf, str } from '../../core/guards';

export interface GeoLocation { name: string; latitude: number; longitude: number }
export interface WeatherConfig { location: GeoLocation | null; unit: 'c' | 'f' }
export interface WeatherData {
  fetchedAt: number; temp: number; code: number; wind: number; humidity: number; max: number; min: number; isDay: boolean;
}
export type WeatherKind = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';

/** Open-Meteo data is cached for 15 minutes; older data is still shown while offline. */
export const CACHE_TTL_MS = 15 * 60_000;

export function cleanLocation(v: unknown): GeoLocation | null {
  if (!isObj(v)) return null;
  const inRange = (x: unknown, lim: number) => typeof x === 'number' && Number.isFinite(x) && Math.abs(x) <= lim;
  const name = str(v.name, 80, '');
  return inRange(v.latitude, 90) && inRange(v.longitude, 180) && name ? { name, latitude: v.latitude as number, longitude: v.longitude as number } : null;
}

export function cleanWeatherConfig(v: unknown): WeatherConfig {
  const o = isObj(v) ? v : {};
  return { location: cleanLocation(o.location), unit: oneOf(o.unit, ['c', 'f'] as const, 'c') };
}

/** Coordinates are rounded to ~1 km: enough for weather, less precise location leaves the device. */
const coord = (n: number) => n.toFixed(2);

export const forecastUrl = (loc: GeoLocation, unit: WeatherConfig['unit']) =>
  'https://api.open-meteo.com/v1/forecast?' + new URLSearchParams({
    latitude: coord(loc.latitude), longitude: coord(loc.longitude),
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day',
    daily: 'temperature_2m_max,temperature_2m_min', forecast_days: '1', timezone: 'auto',
    temperature_unit: unit === 'f' ? 'fahrenheit' : 'celsius',
  }).toString();

export const geocodeUrl = (query: string, lang: string) =>
  'https://geocoding-api.open-meteo.com/v1/search?' + new URLSearchParams({ name: query.trim().slice(0, 80), count: '6', language: lang, format: 'json' }).toString();

export const cacheKey = (loc: GeoLocation, unit: WeatherConfig['unit']) => `weather:${coord(loc.latitude)},${coord(loc.longitude)},${unit}`;

const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export function parseForecast(json: unknown, now: number): WeatherData | null {
  if (!isObj(json) || !isObj(json.current)) return null;
  const c = json.current;
  const d = isObj(json.daily) ? json.daily : {};
  const first = (v: unknown) => (Array.isArray(v) ? n(v[0]) : null);
  const temp = n(c.temperature_2m);
  const code = n(c.weather_code);
  if (temp === null || code === null) return null;
  return {
    fetchedAt: now, temp, code,
    wind: n(c.wind_speed_10m) ?? 0, humidity: n(c.relative_humidity_2m) ?? 0,
    max: first(d.temperature_2m_max) ?? temp, min: first(d.temperature_2m_min) ?? temp,
    isDay: c.is_day !== 0,
  };
}

export function parseGeocode(json: unknown): GeoLocation[] {
  if (!isObj(json) || !Array.isArray(json.results)) return [];
  const out: GeoLocation[] = [];
  for (const r of json.results) {
    if (!isObj(r)) continue;
    const label = [r.name, r.admin1, r.country].filter((x): x is string => typeof x === 'string' && !!x.trim());
    const loc = cleanLocation({ name: [...new Set(label)].join(', '), latitude: r.latitude, longitude: r.longitude });
    if (loc) out.push(loc);
  }
  return out;
}

/** WMO weather interpretation codes -> coarse kind. */
export function weatherKind(code: number): WeatherKind {
  if (code === 0) return 'clear';
  if (code <= 2) return 'partly';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloudy';
}

export const isFresh = (d: WeatherData | null, now: number) => !!d && now - d.fetchedAt < CACHE_TTL_MS;
