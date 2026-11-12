import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../../components/Icon';
import { t } from '../../core/i18n';
import { kvGet, kvSet } from '../../core/kv';
import { hasLocationConsent, requestLocationConsent } from '../../core/data-consent';
import { fetchJson } from '../../core/net';
import type { WidgetProps } from '../types';
import {
  cacheKey, forecastUrl, geocodeUrl, isFresh, parseForecast, parseGeocode, weatherKind,
  type GeoLocation, type WeatherData, type WeatherKind,
} from './logic';

const KIND_ICON: Record<WeatherKind, string> = { clear: 'sun', partly: 'cloud', cloudy: 'cloud', fog: 'fog', drizzle: 'rain', rain: 'rain', snow: 'snow', storm: 'storm' };
type Status = 'loading' | 'ok' | 'offline' | 'error' | 'consent';

function LocationSearch({ L, onPick, onCancel }: { L: WidgetProps<'weather'>['L']; onPick: (l: GeoLocation) => void; onCancel?: () => void }) {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<GeoLocation[] | null>(null);
  const [err, setErr] = useState('');
  const search = async (e: Event) => {
    e.preventDefault();
    if (!q.trim()) return;
    // Firefox: ask for location data consent inside this submit gesture, before anything is sent.
    if (!(await requestLocationConsent())) { setErr(t(L, 'weatherConsent')); return; }
    setBusy(true); setErr('');
    try {
      const r = parseGeocode(await fetchJson(geocodeUrl(q, L)));
      setResults(r);
      if (!r.length) setErr(t(L, 'weatherNoResults'));
    } catch { setErr(t(L, 'weatherError')); }
    setBusy(false);
  };
  return (
    <div class="nd-wx__search">
      <form class="nd-row" onSubmit={search}>
        <label class="nd-field nd-grow">
          <span class="nd-sr">{t(L, 'weatherSearch')}</span>
          <input type="search" value={q} placeholder={t(L, 'weatherSearch')} maxLength={80} onInput={(e) => setQ(e.currentTarget.value)} data-autofocus />
        </label>
        <button type="submit" class="nd-btn nd-btn--sm" disabled={busy}>{t(L, 'weatherFind')}</button>
        {onCancel && <button type="button" class="nd-btn nd-btn--sm nd-btn--ghost" onClick={onCancel}>{t(L, 'cancel')}</button>}
      </form>
      {err && <p class="nd-error" role="alert">{err}</p>}
      {results && results.length > 0 && (
        <ul class="nd-list">
          {results.map((r) => (
            <li key={`${r.latitude},${r.longitude}`}>
              <button type="button" class="nd-list__btn" onClick={() => onPick(r)}>{r.name}</button>
            </li>
          ))}
        </ul>
      )}
      <p class="nd-hint">{t(L, 'weatherPrivacy')}</p>
    </div>
  );
}

export function WeatherView({ L, config, setConfig, editing }: WidgetProps<'weather'>) {
  const { location, unit } = config;
  const [data, setData] = useState<WeatherData | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [changing, setChanging] = useState(false);
  const [consentTick, setConsentTick] = useState(0);
  useEffect(() => { if (!editing) setChanging(false); }, [editing]);

  useEffect(() => {
    if (!location) return;
    const ctrl = new AbortController();
    const key = cacheKey(location, unit);
    const load = async (force: boolean) => {
      const cached = await kvGet<WeatherData>(key);
      if (ctrl.signal.aborted) return;
      if (cached) setData(cached);
      if (!force && isFresh(cached, Date.now())) { setStatus('ok'); return; }
      if (!(await hasLocationConsent())) { if (!ctrl.signal.aborted) setStatus('consent'); return; }
      if (!cached) setStatus('loading');
      try {
        const fresh = parseForecast(await fetchJson(forecastUrl(location, unit), 8000, ctrl.signal), Date.now());
        if (!fresh) throw new Error('bad payload');
        if (ctrl.signal.aborted) return;
        setData(fresh); setStatus('ok');
        void kvSet(key, fresh);
      } catch {
        if (!ctrl.signal.aborted) setStatus(cached ? 'offline' : 'error');
      }
    };
    void load(false);
    // Refresh when the tab comes back after the cache expired.
    const onVis = () => { if (!document.hidden) void kvGet<WeatherData>(key).then((c) => { if (!isFresh(c, Date.now())) void load(true); }); };
    document.addEventListener('visibilitychange', onVis);
    return () => { ctrl.abort(); document.removeEventListener('visibilitychange', onVis); };
  }, [location?.latitude, location?.longitude, unit, consentTick]);

  if (!location || changing) {
    if (!editing) return <p class="nd-hint">{t(L, 'weatherSetLocation')} {t(L, 'widgetEditHint')}</p>;
    return (
      <div class="nd-wx">
        {!location && <p class="nd-hint">{t(L, 'weatherSetLocation')}</p>}
        <LocationSearch L={L} onPick={(loc) => { setConfig({ ...config, location: loc }); setChanging(false); }} onCancel={location ? () => setChanging(false) : undefined} />
      </div>
    );
  }

  const time = (ms: number) => new Intl.DateTimeFormat(L, { hour: '2-digit', minute: '2-digit' }).format(ms);
  const kind = data ? weatherKind(data.code) : 'cloudy';
  const icon = kind === 'clear' && data && !data.isDay ? 'moon' : KIND_ICON[kind];
  return (
    <div class="nd-wx" aria-busy={status === 'loading'}>
      <div class="nd-wx__head">
        <span class="nd-wx__place" title={location.name}>{location.name.split(',')[0]}</span>
        {editing && <div class="nd-row">
          <button type="button" class="nd-btn nd-btn--sm nd-btn--ghost" aria-label={`${t(L, 'weatherUnit')}: °${unit === 'c' ? 'F' : 'C'}`}
            onClick={() => setConfig({ ...config, unit: unit === 'c' ? 'f' : 'c' })}>°{unit.toUpperCase()}</button>
          <button type="button" class="nd-icon-btn nd-icon-btn--sm" aria-label={t(L, 'weatherChange')} title={t(L, 'weatherChange')} onClick={() => setChanging(true)}><Icon name="edit" /></button>
        </div>}
      </div>
      {data ? (
        <>
          <div class="nd-wx__now">
            <Icon name={icon} />
            <span class="nd-wx__temp">{Math.round(data.temp)}°</span>
            <span class="nd-wx__kind">{t(L, `wk_${kind}`)}</span>
          </div>
          <p class="nd-wx__meta">
            <span>{t(L, 'weatherHiLo', { max: Math.round(data.max), min: Math.round(data.min) })}</span>
            <span>{t(L, 'weatherHumidity', { v: Math.round(data.humidity) })}</span>
            <span>{t(L, 'weatherWind', { v: Math.round(data.wind) })}</span>
          </p>
          <p class="nd-hint" role={status === 'offline' ? 'status' : undefined}>
            {status === 'offline' ? t(L, 'weatherOffline', { time: time(data.fetchedAt) }) : t(L, 'weatherUpdated', { time: time(data.fetchedAt) })}
            {' · '}
            {/* CC BY 4.0 attribution required by Open-Meteo */}
            <a class="nd-wx__credit" href="https://open-meteo.com/" rel="noreferrer">{t(L, 'weatherCredit')}</a>
          </p>
        </>
      ) : status === 'consent' ? null : status === 'error' ? <p class="nd-error" role="alert">{t(L, 'weatherError')}</p> : <p class="nd-hint">…</p>}
      {status === 'consent' && (
        <div class="nd-wx__consent">
          <p class="nd-hint">{t(L, 'weatherConsent')}</p>
          <button type="button" class="nd-btn nd-btn--sm" onClick={() => { void requestLocationConsent().then((ok) => { if (ok) setConsentTick((n) => n + 1); }); }}>{t(L, 'grant')}</button>
        </div>
      )}
    </div>
  );
}
