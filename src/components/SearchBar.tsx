import type { Ref } from 'preact';
import { useState } from 'preact/hooks';
import { t } from '../core/i18n';
import type { Settings } from '../core/schema';
import { buildSearchUrl } from '../core/search';
import type { Update } from '../state';

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
