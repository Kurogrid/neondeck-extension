import type { Locale } from './schema';

/** The deck's quote line, chosen by the user (2026-11-12). Add more entries to rotate. */
const QUOTES: Record<Locale, string>[] = [
  {
    en: "Don't make a name for yourself as a cyberpunk by how you live. Make a name by how you die.",
    tr: 'Nasıl yaşadığınla değil, nasıl öldüğünle adını duyur bir cyberpunk olarak.',
  },
];

export const quoteCount = QUOTES.length;
export const quoteAt = (i: number, locale: Locale) => QUOTES[((i % QUOTES.length) + QUOTES.length) % QUOTES.length]![locale];
