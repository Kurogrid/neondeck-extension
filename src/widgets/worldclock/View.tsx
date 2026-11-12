import { useMemo, useState } from 'preact/hooks';
import { Icon } from '../../components/Icon';
import { t } from '../../core/i18n';
import { useMinute } from '../../hooks';
import type { WidgetProps } from '../types';
import { MAX_ZONES, allTimeZones, isValidTz, labelFromTz, zoneTime } from './logic';

export function WorldClockView({ L, s, config, setConfig, editing }: WidgetProps<'worldclock'>) {
  const now = useMinute();
  const [tz, setTz] = useState('');
  const [label, setLabel] = useState('');
  const [err, setErr] = useState('');
  const zones = useMemo(allTimeZones, []);
  const hour12 = s.display.timeFormat === '12h';

  const add = (e: Event) => {
    e.preventDefault();
    const zone = zones.find((z) => z.toLowerCase() === tz.trim().toLowerCase()) ?? tz.trim();
    if (!isValidTz(zone)) { setErr(t(L, 'wcInvalid')); return; }
    if (config.zones.length >= MAX_ZONES) { setErr(t(L, 'wcFull')); return; }
    const name = label.trim().slice(0, 40) || labelFromTz(zone);
    setConfig({ ...config, zones: [...config.zones, { id: `z-${crypto.randomUUID().slice(0, 8)}`, label: name, tz: zone }] });
    setTz(''); setLabel(''); setErr('');
  };

  return (
    <div class="nd-wc">
      {config.zones.length ? (
        <ul class="nd-wc__list">
          {config.zones.map((z) => {
            const zt = zoneTime(now, z.tz, L, hour12);
            return (
              <li key={z.id} class="nd-wc__row">
                <div class="nd-wc__info">
                  <span class="nd-wc__label">{z.label}</span>
                  <span class="nd-hint">{config.showDate ? `${zt.date} · ` : ''}{zt.offset}{zt.dayShift ? ` · ${t(L, zt.dayShift > 0 ? 'wcNextDay' : 'wcPrevDay')}` : ''}</span>
                </div>
                <span class="nd-wc__time">{zt.time}</span>
                {editing && <button type="button" class="nd-icon-btn nd-icon-btn--sm nd-icon-btn--danger nd-wc__rm" aria-label={t(L, 'wcRemove', { name: z.label })} title={t(L, 'wcRemove', { name: z.label })}
                  onClick={() => setConfig({ ...config, zones: config.zones.filter((x) => x.id !== z.id) })}><Icon name="close" /></button>}
              </li>
            );
          })}
        </ul>
      ) : <p class="nd-hint">{t(L, 'wcEmpty')}</p>}
      {editing && config.zones.length < MAX_ZONES && (
        <form class="nd-wc__add" onSubmit={add}>
          <label class="nd-field">
            <span class="nd-sr">{t(L, 'wcZone')}</span>
            <input list="nd-tz-list" value={tz} placeholder={t(L, 'wcZone')} maxLength={64} onInput={(e) => setTz(e.currentTarget.value)} />
          </label>
          <datalist id="nd-tz-list">{zones.map((z) => <option key={z} value={z} />)}</datalist>
          <div class="nd-row">
            <label class="nd-field nd-grow">
              <span class="nd-sr">{t(L, 'wcLabel')}</span>
              <input value={label} placeholder={t(L, 'wcLabel')} maxLength={40} onInput={(e) => setLabel(e.currentTarget.value)} />
            </label>
            <button type="submit" class="nd-btn nd-btn--sm">{t(L, 'wcAdd')}</button>
          </div>
          {err && <p class="nd-error" role="alert">{err}</p>}
        </form>
      )}
    </div>
  );
}
