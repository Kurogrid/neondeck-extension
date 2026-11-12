import { permSupported } from '../core/permissions';
import { useState } from 'preact/hooks';
import { categoryLabel, t } from '../core/i18n';
import { newLinkId } from '../core/netlinks';
import type { Locale, Netlink } from '../core/schema';
import { safeUrl, slug } from '../core/validate';
import type { PermissionState } from '../hooks';
import { Icon, PICKABLE_ICONS, resolveIcon } from './Icon';
import { Modal } from './Modal';

interface Props { L: Locale; link?: Netlink; categories: string[]; fav: PermissionState; onSave: (l: Netlink) => void; onClose: () => void }

/** Accepts "example.com" as a convenience and turns it into https://example.com/. */
export const normalizeUserUrl = (v: string) => safeUrl(/^[a-z][a-z0-9+.-]*:/i.test(v.trim()) ? v : `https://${v.trim()}`);

export function LinkEditor({ L, link, categories, fav, onSave, onClose }: Props) {
  const [title, setTitle] = useState(link?.title ?? '');
  const [url, setUrl] = useState(link?.url ?? '');
  const [category, setCategory] = useState(categoryLabel(L, link?.category ?? categories[0] ?? 'other'));
  const [iconName, setIconName] = useState(resolveIcon(link?.icon.name));
  const [useFav, setUseFav] = useState(link?.icon.kind === 'favicon' && fav.granted);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const onFavChange = async (checked: boolean) => {
    setNote('');
    if (!checked) { setUseFav(false); return; }
    if (!fav.available) { setNote(t(L, 'faviconUnavailable')); return; }
    const ok = fav.granted || (await fav.request());
    setUseFav(ok);
    if (!ok) setNote(t(L, 'faviconDenied'));
  };

  // Typed labels map back to known ids (e.g. "Günlük" -> daily); anything else becomes a custom slug.
  const toCategoryId = (label: string) =>
    categories.find((c) => categoryLabel(L, c).toLowerCase() === label.trim().toLowerCase()) ?? (slug(label) || 'other');

  const submit = (e: Event) => {
    e.preventDefault();
    const cleanUrl = normalizeUserUrl(url);
    if (!title.trim()) { setError(t(L, 'invalidTitle')); return; }
    if (!cleanUrl) { setError(t(L, 'invalidUrl')); return; }
    onSave({
      id: link?.id ?? newLinkId(),
      title: title.trim().slice(0, 80),
      url: cleanUrl,
      category: toCategoryId(category),
      icon: useFav ? { kind: 'favicon' } : { kind: 'svg', name: iconName },
    });
    onClose();
  };

  return (
    <Modal title={t(L, link ? 'linkEditorEdit' : 'linkEditorAdd')} closeLabel={t(L, 'close')} onClose={onClose}>
      <form class="nd-form" onSubmit={submit} noValidate>
        <label class="nd-field"><span>{t(L, 'fieldTitle')}</span>
          <input data-autofocus value={title} maxLength={80} required onInput={(e) => setTitle(e.currentTarget.value)} /></label>
        <label class="nd-field"><span>{t(L, 'fieldUrl')}</span>
          <input type="url" inputMode="url" value={url} required placeholder="https://" onInput={(e) => setUrl(e.currentTarget.value)} /></label>
        <label class="nd-field"><span>{t(L, 'fieldCategory')}</span>
          <input list="nd-cat-list" value={category} maxLength={40} onInput={(e) => setCategory(e.currentTarget.value)} />
          <datalist id="nd-cat-list">{categories.map((c) => <option key={c} value={categoryLabel(L, c)} />)}</datalist></label>
        <div class="nd-field">
          <span id="nd-icon-label">{t(L, 'fieldIcon')}</span>
          <div class="nd-icon-pick" role="radiogroup" aria-labelledby="nd-icon-label">
            {PICKABLE_ICONS.map((n) => (
              <button type="button" key={n} role="radio" aria-checked={!useFav && iconName === n} aria-label={n} title={n}
                class="nd-icon-pick__opt" disabled={useFav} onClick={() => setIconName(n)}><Icon name={n} /></button>
            ))}
          </div>
          {permSupported('favicon') && <label class="nd-check"><input type="checkbox" checked={useFav} onChange={(e) => void onFavChange(e.currentTarget.checked)} /> {t(L, 'useFavicon')}</label>}
          {note && <p class="nd-note" role="status">{note}</p>}
        </div>
        {error && <p class="nd-error" role="alert">{error}</p>}
        <div class="nd-form__actions">
          <button type="submit" class="nd-btn nd-btn--primary">{t(L, 'save')}</button>
          <button type="button" class="nd-btn" onClick={onClose}>{t(L, 'cancel')}</button>
        </div>
      </form>
    </Modal>
  );
}
