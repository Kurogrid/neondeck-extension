import { useState } from 'preact/hooks';
import { categoryLabel, t } from '../core/i18n';
import type { LinkGroup } from '../core/netlinks';
import { faviconUrl } from '../core/permissions';
import type { Netlink, Settings } from '../core/schema';
import { usePermission } from '../hooks';
import type { Update } from '../state';
import { Icon } from './Icon';
import { LinkEditor } from './LinkEditor';

function LinkIcon({ link, favicons }: { link: Netlink; favicons: boolean }) {
  if (link.icon.kind === 'favicon' && favicons) return <img class="nd-card__favicon" src={faviconUrl(link.url)} alt="" width={24} height={24} loading="lazy" />;
  return <Icon name={link.icon.kind === 'svg' ? link.icon.name : 'link'} size={24} />;
}

interface Props { s: Settings; update: Update; groups: LinkGroup[]; shortcuts: Netlink[] }

export function Netlinks({ s, update, groups, shortcuts }: Props) {
  const L = s.profile.locale;
  const fav = usePermission('favicon');
  const [editing, setEditing] = useState(false);
  const [editor, setEditor] = useState<{ link?: Netlink } | null>(null);
  const keyOf = new Map(shortcuts.map((l, i) => [l.id, i + 1]));
  const collapsed = s.netlinks.collapsed;

  const toggle = (c: string) => update((d) => {
    const set = new Set(d.netlinks.collapsed);
    if (!set.delete(c)) set.add(c);
    d.netlinks.collapsed = [...set];
  });
  const remove = (l: Netlink) => {
    if (window.confirm(t(L, 'confirmDeleteLink', { name: l.title }))) update((d) => { d.netlinks.items = d.netlinks.items.filter((x) => x.id !== l.id); });
  };
  const save = (l: Netlink) => update((d) => {
    const i = d.netlinks.items.findIndex((x) => x.id === l.id);
    if (i >= 0) d.netlinks.items[i] = l; else d.netlinks.items.push(l);
    if (!d.netlinks.categoryOrder.includes(l.category)) d.netlinks.categoryOrder.push(l.category);
  });

  return (
    <section class="nd-netlinks" aria-labelledby="nd-netlinks-title">
      <div class="nd-section-head">
        <h2 id="nd-netlinks-title" class="nd-section-title">{t(L, 'netlinks')}</h2>
        <div class="nd-actions">
          {s.netlinks.items.length > 0 && (
            <button type="button" class="nd-icon-btn" aria-pressed={editing} onClick={() => setEditing(!editing)}
              aria-label={t(L, editing ? 'doneEditing' : 'editLinks')} title={t(L, editing ? 'doneEditing' : 'editLinks')}>
              <Icon name={editing ? 'check' : 'edit'} />
            </button>
          )}
          <button type="button" class="nd-icon-btn" onClick={() => setEditor({})} aria-label={t(L, 'addLink')} title={t(L, 'addLink')}><Icon name="plus" /></button>
          <button
            type="button"
            class="nd-icon-btn"
            onClick={() => update((d) => { d.display.showNetlinks = false; })}
            aria-label={t(L, 'hideNetlinks')}
            title={t(L, 'hideNetlinks')}
          >
            <Icon name="close" />
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div class="nd-empty">
          <p>{t(L, 'emptyLinks')}</p>
          <button type="button" class="nd-btn nd-btn--primary" onClick={() => setEditor({})}><Icon name="plus" /> {t(L, 'addLink')}</button>
        </div>
      ) : (
        groups.map((g) => {
          const open = !collapsed.includes(g.category);
          const label = categoryLabel(L, g.category);
          const listId = `nd-cat-${g.category}`;
          return (
            <div class="nd-cat" key={g.category}>
              <button type="button" class="nd-cat__head" aria-expanded={open} aria-controls={listId}
                title={t(L, 'toggleCategory', { name: label })} onClick={() => toggle(g.category)}>
                <span class="nd-cat__name">{label}</span><span class="nd-cat__count">{g.items.length}</span><Icon name="chevron" size={16} />
              </button>
              {open && (
                <ul class="nd-grid" id={listId}>
                  {g.items.map((l) => {
                    const key = keyOf.get(l.id);
                    return (
                      <li key={l.id} class="nd-card-wrap">
                        <a class="nd-card nd-chamfer" href={l.url} rel="noreferrer" aria-keyshortcuts={key ? String(key) : undefined}>
                          {key && <kbd class="nd-card__key" aria-hidden="true">{key}</kbd>}
                          <LinkIcon link={l} favicons={fav.granted} />
                          <span class="nd-card__title">{l.title}</span>
                        </a>
                        {editing && (
                          <div class="nd-card__tools">
                            <button type="button" class="nd-icon-btn nd-icon-btn--sm" onClick={() => setEditor({ link: l })} aria-label={t(L, 'editLink', { name: l.title })}><Icon name="edit" size={16} /></button>
                            <button type="button" class="nd-icon-btn nd-icon-btn--sm nd-icon-btn--danger" onClick={() => remove(l)} aria-label={t(L, 'deleteLink', { name: l.title })}><Icon name="trash" size={16} /></button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })
      )}
      {groups.length > 0 && <p class="nd-hint">{t(L, 'shortcutHint')}</p>}
      {editor && <LinkEditor L={L} link={editor.link} categories={s.netlinks.categoryOrder} fav={fav} onSave={save} onClose={() => setEditor(null)} />}
    </section>
  );
}
