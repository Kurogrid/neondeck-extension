import { describe, expect, it } from 'vitest';
import { detectBrowser } from './browser';
import { wt } from './text';

const UA = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0',
  opera: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/126.0.0.0',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0',
};

describe('welcome page', () => {
  it('detects the browser to preselect the setup tab', () => {
    expect(detectBrowser(UA.chrome, false)).toBe('chrome');
    expect(detectBrowser(UA.edge, false)).toBe('edge');
    expect(detectBrowser(UA.opera, false)).toBe('opera');
    expect(detectBrowser(UA.firefox, false)).toBe('firefox');
    expect(detectBrowser('unknown', true)).toBe('firefox');
  });

  it('fills step numbers in both languages', () => {
    expect(wt('en', 'stepOf', { n: 3 })).toBe('STEP 3');
    expect(wt('tr', 'stepOf', { n: 3 })).toBe('ADIM 3');
  });
});
