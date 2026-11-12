import { useState } from 'preact/hooks';
import { Icon } from '../../components/Icon';
import { normalizeUserUrl } from '../../components/LinkEditor';
import { t } from '../../core/i18n';
import type { WidgetProps } from '../types';
import { MAX_AI_LINKS } from './logic';

export function AiLinksView({ L, config, setConfig, editing }: WidgetProps<'ailinks'>) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [err, setErr] = useState('');

  const add = (e: Event) => {
    e.preventDefault();
    const safe = normalizeUserUrl(url);
    const n = name.trim().slice(0, 30);
    if (!safe || !n) { setErr(t(L, 'engineInvalid')); return; }
    setConfig({ links: [...config.links, { id: `ai-${crypto.randomUUID().slice(0, 8)}`, name: n, url: safe }] });
    setName(''); setUrl(''); setErr('');
  };

  return (
    <div class="nd-ai">
      <div class="nd-ai__grid">
        {config.links.map((l) => (
          <div key={l.id} class="nd-ai__item">
            <a class="nd-btn nd-chamfer nd-ai__link" href={l.url} rel="noreferrer">{l.name}</a>
            {editing && (
              <button type="button" class="nd-icon-btn nd-icon-btn--sm nd-icon-btn--danger" aria-label={t(L, 'aiRemove', { name: l.name })} title={t(L, 'aiRemove', { name: l.name })}
                onClick={() => setConfig({ links: config.links.filter((x) => x.id !== l.id) })}><Icon name="close" /></button>
            )}
          </div>
        ))}
        {!config.links.length && <p class="nd-hint">{t(L, 'aiEmpty')}</p>}
      </div>
      {editing && config.links.length < MAX_AI_LINKS && (
        <form class="nd-form nd-form--inline" onSubmit={add}>
          <label class="nd-field">{t(L, 'aiName')}<input value={name} maxLength={30} onInput={(e) => setName(e.currentTarget.value)} /></label>
          <label class="nd-field">{t(L, 'aiUrl')}<input value={url} maxLength={500} placeholder="https://" onInput={(e) => setUrl(e.currentTarget.value)} /></label>
          {err && <p class="nd-error" role="alert">{err}</p>}
          <button type="submit" class="nd-btn nd-btn--sm">{t(L, 'aiAdd')}</button>
        </form>
      )}
    </div>
  );
}
