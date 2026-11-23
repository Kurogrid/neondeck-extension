import type { Ref } from 'preact';
import { useState } from 'preact/hooks';
import { t } from '../core/i18n';
import type { Settings } from '../core/schema';
import { buildSearchUrl } from '../core/search';
import { ARASAKA_FAN_EMBLEM } from '../scenes/overlays';
import type { Update } from '../state';
import { ARASAKA_GLYPHS, ARASAKA_WORD } from './ArasakaBanner';

export function SearchBar({ s, update, inputRef }: { s: Settings; update: Update; inputRef: Ref<HTMLInputElement> }) {
  const L = s.profile.locale;
  const [q, setQ] = useState('');
  const visible = s.search.engines.filter((e) => e.visible);
  const engine = visible.find((e) => e.id === s.search.active) ?? visible[0];
  if (!engine) return null;
  const submit = (e: Event) => {
    e.preventDefault();
    const url = buildSearchUrl(engine, q);
    if (url) window.location.assign(url);
  };

  if (ARASAKA_FAN_EMBLEM && s.theme.id === 'arasaka') {
    return (
      <form class="nd-search-arasaka" role="search" onSubmit={submit}>
        <div class="nd-search-arasaka__brand" aria-hidden="true">
          <svg class="nd-search-arasaka__svg" viewBox="0 0 180 152" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(90, 62) scale(1.25)" fill="#e81523">
              <rect x="-36" y="-34" width="72" height="8" />
              <rect x="-28" y="-20" width="56" height="6" />
              <rect x="-24" y="-20" width="8" height="56" />
              <rect x="16" y="-20" width="8" height="56" />
              <rect x="-6" y="-8" width="12" height="12" />
            </g>
            <g transform="translate(10, 128) scale(0.36)" fill="#f2f2f4">
              {ARASAKA_WORD.map((letter, idx) => (
                <g key={idx} transform={`translate(${idx * 56}, 0)`}>
                  {ARASAKA_GLYPHS[letter].map((d, pIdx) => (
                    <path key={pIdx} d={d} fillRule="evenodd" />
                  ))}
                </g>
              ))}
            </g>
          </svg>
          <span class="nd-search-arasaka__corp">CORPORATION</span>
        </div>

        <div class="nd-search-arasaka__console">
          <div class="nd-search-arasaka__head">
            <span class="nd-search-arasaka__label" aria-hidden="true">SECURITY LOGIN</span>
            {visible.length > 1 && (
              <select
                class="nd-search-arasaka__engine"
                aria-label={t(L, 'engineLabel')}
                value={engine.id}
                onChange={(e) => {
                  const v = e.currentTarget.value;
                  update((d) => { d.search.active = v; });
                }}
              >
                {visible.map((en) => <option key={en.id} value={en.id}>{en.name}</option>)}
              </select>
            )}
          </div>

          <div class="nd-search-arasaka__box">
            <span class="nd-search-arasaka__prefix" aria-hidden="true">UID_</span>
            <input
              ref={inputRef}
              id="nd-search"
              class="nd-search-arasaka__input"
              type="search"
              value={q}
              autoComplete="off"
              spellcheck={false}
              aria-label={t(L, 'searchLabel')}
              placeholder={engine.placeholder || t(L, 'searchPlaceholder', { name: engine.name })}
              onInput={(e) => setQ(e.currentTarget.value)}
            />
            <button type="submit" class="nd-search-arasaka__go">{t(L, 'scan')}</button>
          </div>

          <div class="nd-search-arasaka__meta" aria-hidden="true">
            <div class="nd-search-arasaka__rule">
              <span class="nd-search-arasaka__slashes">/////////////</span>
              <span class="nd-search-arasaka__line" />
            </div>
            <div class="nd-search-arasaka__telemetry">
              <div class="nd-search-arasaka__row">
                <span class="nd-search-arasaka__k">CURR_NETWORK:</span>{' '}
                <span class="nd-search-arasaka__v">ACN002077</span>
              </div>
              <div class="nd-search-arasaka__row">
                <span class="nd-search-arasaka__k">NL_PORT_STATUS:</span>{' '}
                <span class="nd-search-arasaka__v">OPEN</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form class="nd-search nd-chamfer" role="search" onSubmit={submit}>
      {visible.length > 1 && (
        <select class="nd-search__engine" aria-label={t(L, 'engineLabel')} value={engine.id}
          onChange={(e) => { const v = e.currentTarget.value; update((d) => { d.search.active = v; }); }}>
          {visible.map((en) => <option key={en.id} value={en.id}>{en.name}</option>)}
        </select>
      )}
      <input ref={inputRef} id="nd-search" class="nd-search__input" type="search" value={q} autoComplete="off" spellcheck={false}
        aria-label={t(L, 'searchLabel')} placeholder={engine.placeholder || t(L, 'searchPlaceholder', { name: engine.name })} onInput={(e) => setQ(e.currentTarget.value)} />
      <button type="submit" class="nd-btn nd-btn--primary nd-search__go">{t(L, 'scan')}</button>
    </form>
  );
}
