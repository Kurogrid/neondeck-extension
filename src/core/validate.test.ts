import { describe, expect, it } from 'vitest';
import { safeUrl, sanitizeSettings } from './validate';

describe('safeUrl', () => {
  it('accepts http(s)', () => expect(safeUrl('https://example.com')).toBe('https://example.com/'));
  it('rejects javascript:', () => expect(safeUrl('javascript:alert(1)')).toBeNull());
  it('rejects data:', () => expect(safeUrl('data:text/html,x')).toBeNull());
  it('rejects non-strings', () => expect(safeUrl(42)).toBeNull());
});
describe('sanitizeSettings', () => {
  it('returns defaults for garbage', () => expect(sanitizeSettings('x').theme.id).toBe('edgerunners'));
  it('drops unsafe netlinks', () => {
    const s = sanitizeSettings({ netlinks: { items: [{ title: 'a', url: 'javascript:1' }, { title: 'b', url: 'https://b.com' }] } });
    expect(s.netlinks.items).toHaveLength(1);
  });
  it('rejects unknown theme', () => expect(sanitizeSettings({ theme: { id: 'evil' } }).theme.id).toBe('edgerunners'));
});
