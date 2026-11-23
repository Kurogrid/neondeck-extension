import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { useDialog } from '../hooks';
import { Icon } from './Icon';

interface Props {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ComponentChildren;
  variant?: 'center' | 'drawer-left' | 'drawer-right';
  open?: boolean;
}

export function Modal({ title, closeLabel, onClose, children, variant = 'center', open = true }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const ref = useDialog<HTMLDivElement>(onClose, open);
  const id = `nd-dlg-${title.replace(/\W+/g, '-').toLowerCase()}`;

  useEffect(() => {
    const el = overlayRef.current as (HTMLDivElement & { inert?: boolean }) | null;
    if (el) el.inert = !open;
  }, [open]);

  return (
    <div
      ref={overlayRef}
      class={`nd-overlay nd-overlay--${variant}${open ? '' : ' nd-overlay--hidden'}`}
      aria-hidden={open ? undefined : 'true'}
      onMouseDown={(e) => { if (open && e.target === e.currentTarget) onClose(); }}
    >
      <div ref={ref} class={`nd-dialog nd-dialog--${variant} nd-chamfer`} role="dialog" aria-modal={open ? 'true' : undefined} aria-labelledby={id}>
        <header class="nd-dialog__head">
          <h2 id={id} class="nd-dialog__title"><span class="nd-dialog__bar" aria-hidden="true" />{title}</h2>
          <button type="button" class="nd-icon-btn" onClick={onClose} aria-label={closeLabel} title={closeLabel}><Icon name="close" /></button>
        </header>
        <div class="nd-dialog__body">{children}</div>
      </div>
    </div>
  );
}
