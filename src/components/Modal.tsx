import type { ComponentChildren } from 'preact';
import { useDialog } from '../hooks';
import { Icon } from './Icon';

interface Props { title: string; closeLabel: string; onClose: () => void; children: ComponentChildren; variant?: 'center' | 'drawer-left' }

export function Modal({ title, closeLabel, onClose, children, variant = 'center' }: Props) {
  const ref = useDialog<HTMLDivElement>(onClose);
  const id = `nd-dlg-${title.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div class={`nd-overlay nd-overlay--${variant}`} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} class={`nd-dialog nd-dialog--${variant} nd-chamfer`} role="dialog" aria-modal="true" aria-labelledby={id}>
        <header class="nd-dialog__head">
          <h2 id={id} class="nd-dialog__title">{title}</h2>
          <button type="button" class="nd-icon-btn" onClick={onClose} aria-label={closeLabel} title={closeLabel}><Icon name="close" /></button>
        </header>
        <div class="nd-dialog__body">{children}</div>
      </div>
    </div>
  );
}
