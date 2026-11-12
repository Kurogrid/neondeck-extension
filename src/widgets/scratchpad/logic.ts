import { isObj, str } from '../../core/guards';

export interface Note { id: string; title: string; content: string }
export interface ScratchpadConfig { notes: Note[]; active: string }

export const MAX_NOTES = 10;
/** Total size budget for all notes (characters ~ bytes for typical text). */
export const MAX_TOTAL_CHARS = 1_000_000;

export const newNote = (title: string): Note => ({ id: `n-${crypto.randomUUID().slice(0, 8)}`, title, content: '' });

export function cleanScratchpadConfig(v: unknown): ScratchpadConfig {
  const o = isObj(v) ? v : {};
  const notes: Note[] = [];
  let budget = MAX_TOTAL_CHARS;
  const ids = new Set<string>();
  const push = (id: string, title: string, content: string) => {
    if (notes.length >= MAX_NOTES) return;
    const body = content.slice(0, Math.max(0, budget));
    budget -= body.length;
    let nid = id || `n-${notes.length + 1}`;
    while (ids.has(nid)) nid += '-2';
    ids.add(nid);
    notes.push({ id: nid, title: title || `#${notes.length + 1}`, content: body });
  };
  if (Array.isArray(o.notes)) {
    for (const n of o.notes) if (isObj(n)) push(str(n.id, 40, ''), str(n.title, 40, ''), typeof n.content === 'string' ? n.content : '');
  } else if (typeof o.content === 'string') {
    push('n-1', '#1', o.content); // Cyberstart format: a single note
  }
  if (!notes.length) push('n-1', '#1', '');
  const active = typeof o.active === 'string' && notes.some((n) => n.id === o.active) ? o.active : notes[0]!.id;
  return { notes, active };
}

export const totalChars = (c: ScratchpadConfig) => c.notes.reduce((s, n) => s + n.content.length, 0);

/** Replace one note's content, trimmed so the total stays within the budget. */
export function setNoteContent(c: ScratchpadConfig, id: string, content: string): ScratchpadConfig {
  const others = c.notes.reduce((s, n) => (n.id === id ? s : s + n.content.length), 0);
  const room = Math.max(0, MAX_TOTAL_CHARS - others);
  return { ...c, notes: c.notes.map((n) => (n.id === id ? { ...n, content: content.slice(0, room) } : n)) };
}
