import type { WidgetState } from '../core/schema';

const sorted = (list: WidgetState[]) => [...list].sort((a, b) => a.order - b.order);
const renumber = (list: WidgetState[]) => list.map((w, i) => ({ ...w, order: i }));

/** Drag & drop: put `fromId` where `toId` is (others shift). Unknown ids leave the list as it is. */
export function moveWidget(list: WidgetState[], fromId: string, toId: string): WidgetState[] {
  const s = sorted(list);
  const from = s.findIndex((w) => w.id === fromId);
  const to = s.findIndex((w) => w.id === toId);
  if (from < 0 || to < 0 || from === to) return renumber(s);
  const [item] = s.splice(from, 1);
  s.splice(to, 0, item!);
  return renumber(s);
}

/**
 * Keyboard / button reorder: swap places with the next widget up (-1) or down (+1).
 * `only` limits the neighbours (e.g. enabled widgets, as shown in the panel); hidden ones keep their slots.
 */
export function moveWidgetBy(list: WidgetState[], id: string, dir: -1 | 1, only: (w: WidgetState) => boolean = () => true): WidgetState[] {
  const visible = sorted(list).filter((w) => w.id === id || only(w));
  const i = visible.findIndex((w) => w.id === id);
  const target = visible[i + dir];
  return i < 0 || !target ? renumber(sorted(list)) : moveWidget(list, id, target.id);
}
