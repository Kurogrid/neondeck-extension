import type { Netlink } from './schema';
import { ext } from './ext';
import { safeUrl } from './validate';

/** Drops the unread counter a tab title leaves in a bookmark name, e.g. "(5) Pinterest" -> "Pinterest". */
export const stripTitleCounter = (title: string) => title.replace(/^\s*\(\d+\+?\)\s*/, '').trim();

export interface BookmarkNode { title?: string; url?: string; children?: BookmarkNode[] }

/** Flatten a chrome.bookmarks tree into netlinks (http/https only, deduplicated, capped). */
export function flattenBookmarks(nodes: BookmarkNode[], existingUrls: Set<string>, max = 100): Netlink[] {
  const out: Netlink[] = [];
  const seen = new Set(existingUrls);
  const walk = (list: BookmarkNode[]) => {
    for (const n of list) {
      if (out.length >= max) return;
      if (n.url) {
        const url = safeUrl(n.url);
        if (url && !seen.has(url)) {
          seen.add(url);
          out.push({ id: crypto.randomUUID().slice(0, 8), title: (stripTitleCounter(n.title ?? '') || new URL(url).hostname).slice(0, 80), url, category: 'bookmarks', icon: { kind: 'svg', name: 'link' } });
        }
      }
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

/** Requires the optional `bookmarks` permission to be granted already. */
export async function readBrowserBookmarks(existingUrls: Set<string>): Promise<Netlink[]> {
  const tree = await ext!.bookmarks.getTree();
  return flattenBookmarks(tree, existingUrls);
}
