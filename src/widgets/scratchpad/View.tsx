import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../../components/Icon';
import { t } from '../../core/i18n';
import type { WidgetProps } from '../types';
import { MAX_NOTES, MAX_TOTAL_CHARS, newNote, setNoteContent, totalChars } from './logic';

const SAVE_MS = 400;

export function ScratchpadView({ L, config, setConfig, editing }: WidgetProps<'scratchpad'>) {
  const active = config.notes.find((n) => n.id === config.active) ?? config.notes[0]!;
  // Local draft so typing never waits for storage; saved after a short pause.
  const [draft, setDraft] = useState(active.content);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef({ config, draft, id: active.id });
  latest.current = { config, draft, id: active.id };

  const flush = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
    const { config: c, draft: d, id } = latest.current;
    if (c.notes.find((n) => n.id === id)?.content !== d) setConfig(setNoteContent(c, id, d));
  };
  // Follow outside changes (other tab, import) unless the user is mid-edit.
  useEffect(() => { if (!timer.current) setDraft(active.content); }, [active.id, active.content]);
  useEffect(() => () => flush(), []);

  const others = totalChars(config) - active.content.length;
  const room = Math.max(0, MAX_TOTAL_CHARS - others);
  const used = others + draft.length;

  const switchTo = (id: string) => { flush(); setConfig({ ...latest.current.config, active: id }); };
  const add = () => {
    flush();
    const n = newNote(`#${config.notes.length + 1}`);
    setConfig({ notes: [...latest.current.config.notes, n], active: n.id });
  };
  const remove = () => {
    if (active.content.trim() && !window.confirm(t(L, 'spConfirmDelete', { name: active.title }))) return;
    clearTimeout(timer.current); timer.current = undefined;
    const notes = config.notes.filter((n) => n.id !== active.id);
    const next = notes.length ? notes : [newNote('#1')];
    setConfig({ notes: next, active: next[0]!.id });
  };

  return (
    <div class="nd-sp">
      {(editing || config.notes.length > 1) && <div class="nd-sp__tabs" role="tablist" aria-label={t(L, 'w_scratchpad')}>
        {config.notes.map((n) => (
          <button key={n.id} type="button" role="tab" aria-selected={n.id === active.id} class="nd-sp__tab" onClick={() => switchTo(n.id)}>{n.title}</button>
        ))}
        {editing && config.notes.length < MAX_NOTES && (
          <button type="button" class="nd-icon-btn nd-icon-btn--sm" aria-label={t(L, 'spNewNote')} title={t(L, 'spNewNote')} onClick={add}><Icon name="plus" /></button>
        )}
      </div>}
      {editing && <div class="nd-row">
        <label class="nd-field nd-grow">
          <span class="nd-sr">{t(L, 'spNoteTitle')}</span>
          <input value={active.title} maxLength={40} aria-label={t(L, 'spNoteTitle')}
            onChange={(e) => { flush(); const title = e.currentTarget.value.trim().slice(0, 40) || active.title; setConfig({ ...latest.current.config, notes: latest.current.config.notes.map((n) => (n.id === active.id ? { ...n, title } : n)) }); }} />
        </label>
        <button type="button" class="nd-icon-btn nd-icon-btn--sm nd-icon-btn--danger" aria-label={t(L, 'spDeleteNote')} title={t(L, 'spDeleteNote')} onClick={remove}><Icon name="trash" /></button>
      </div>}
      <textarea class="nd-sp__text" aria-label={t(L, 'spNoteText')} value={draft} maxLength={room} spellcheck={false}
        onInput={(e) => { setDraft(e.currentTarget.value); clearTimeout(timer.current); timer.current = setTimeout(flush, SAVE_MS); }}
        onBlur={flush} />
      {editing && <p class="nd-hint">{t(L, 'spUsage', { used: `${Math.max(0.1, (used / MAX_TOTAL_CHARS) * 100).toFixed(1)}%` })}</p>}
    </div>
  );
}
