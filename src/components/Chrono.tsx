import { clockParts, dayPart, formatDate } from '../core/clock';
import { t } from '../core/i18n';
import type { Settings } from '../core/schema';
import { useMinute } from '../hooks';

export function Chrono({ s }: { s: Settings }) {
  const now = useMinute();
  const L = s.profile.locale;
  const { showGreeting, showTime, showDate, timeFormat } = s.display;
  if (!showGreeting && !showTime && !showDate) return null;
  const greeting = t(L, `greeting_${dayPart(now.getHours())}`, { name: s.profile.userName || t(L, 'defaultName') });
  const c = clockParts(now, L, timeFormat);
  return (
    <section class="nd-chrono">
      {showGreeting && <h1 class="nd-greeting" data-text={greeting}>{greeting}</h1>}
      {showTime && (
        <time class="nd-clock" dateTime={now.toISOString()}>
          <span class="nd-clock__h">{c.hours}</span>
          <span class="nd-clock__sep" aria-hidden="true">:</span>
          <span class="nd-clock__m">{c.minutes}</span>
          {c.period && <span class="nd-clock__period">{c.period}</span>}
        </time>
      )}
      {showDate && <p class="nd-date">{formatDate(now, L)}</p>}
    </section>
  );
}
