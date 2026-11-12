import type { Netlink } from './schema';

export interface LinkGroup { category: string; items: Netlink[] }

/** Groups links by category, following `order`; categories missing from it are appended. Empty groups are skipped. */
export function groupNetlinks(items: Netlink[], order: string[]): LinkGroup[] {
  const cats = [...order, ...items.map((i) => i.category).filter((c) => !order.includes(c))];
  return [...new Set(cats)].map((category) => ({ category, items: items.filter((i) => i.category === category) })).filter((g) => g.items.length);
}

/** The links bound to keys 1-9: first nine visible links in display order. */
export function shortcutLinks(groups: LinkGroup[], collapsed: string[]): Netlink[] {
  return groups.filter((g) => !collapsed.includes(g.category)).flatMap((g) => g.items).slice(0, 9);
}

export const newLinkId = () => crypto.randomUUID().slice(0, 8);
