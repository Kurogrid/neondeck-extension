import { isObj, safeUrl, str } from '../../core/guards';

export interface AiLink { id: string; name: string; url: string }
export interface AiLinksConfig { links: AiLink[] }

export const MAX_AI_LINKS = 12;

export const defaultAiLinks = (): AiLink[] => [
  { id: 'claude', name: 'Claude', url: 'https://claude.ai/' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/' },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/' },
];

export function cleanAiLinksConfig(v: unknown): AiLinksConfig {
  const o = isObj(v) ? v : {};
  if (!Array.isArray(o.links)) return { links: defaultAiLinks() };
  const links: AiLink[] = [];
  const ids = new Set<string>();
  for (const l of o.links.slice(0, MAX_AI_LINKS)) {
    if (!isObj(l)) continue;
    const url = safeUrl(l.url);
    const name = str(l.name, 30, '');
    if (!url || !name) continue;
    let id = str(l.id, 40, '') || `ai-${links.length + 1}`;
    while (ids.has(id)) id += '-2';
    ids.add(id);
    links.push({ id, name, url });
  }
  return { links };
}
