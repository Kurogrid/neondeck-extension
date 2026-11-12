import { useState } from 'preact/hooks';
import { t } from '../core/i18n';
import { quoteAt, quoteCount } from '../core/quotes';
import type { Locale } from '../core/schema';

export function Quote({ locale }: { locale: Locale }) {
  const [i] = useState(() => Math.floor(Math.random() * quoteCount));
  return (
    <figure class="nd-quote" aria-label={t(locale, 'quoteLabel')}>
      <blockquote class="nd-quote__text">{quoteAt(i, locale)}</blockquote>
    </figure>
  );
}
