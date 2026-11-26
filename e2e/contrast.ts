import type { Page } from '@playwright/test';

export interface ContrastIssue { theme: string; text: string; selector: string; ratio: number; need: number; hidden: boolean }

/**
 * Measures text contrast against what is actually painted behind it (scene, wallpaper, overlays):
 * screenshot the page with glyph fills made transparent (text shadows stay, since they are part of what the reader sees), then compare each text colour with the
 * background pixels under the text's own glyph box. Reports the 10th-percentile ratio (the worst tenth of the box).
 */
export async function measureContrast(page: Page, theme: string, root = 'body'): Promise<ContrastIssue[]> {
  const items = await page.evaluate((rootSel) => {
    const out: any[] = [];
    const rootEl = document.querySelector(rootSel);
    if (!rootEl) return out;
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
    const seen = new Set<Element>();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || seen.has(el) || !n.textContent?.trim()) continue;
      seen.add(el);
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
      const range = document.createRange(); range.selectNodeContents(n); const r = range.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      let op = 1; for (let a: Element | null = el; a; a = a.parentElement) op *= parseFloat(getComputedStyle(a).opacity);
      if (op < 0.05) continue;
      const m = cs.color.match(/[\d.]+/g)!.map(Number);
      const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
      const path: string[] = []; for (let a: Element | null = el; a && path.length < 3; a = a.parentElement) path.unshift(a.tagName.toLowerCase() + (a.classList[0] ? '.' + a.classList[0] : ''));
      out.push({
        text: n.textContent.trim().slice(0, 28), selector: path.join(' > '),
        box: [Math.max(0, r.left), Math.max(0, r.top), Math.min(innerWidth, r.right), Math.min(innerHeight, r.bottom)],
        rgb: m.slice(0, 3), alpha: (m[3] ?? 1) * op, large: size >= 24 || (size >= 18.66 && bold),
        hidden: !!el.closest('[aria-hidden="true"]'),
      });
    }
    // Hide text only (keep boxes, borders and backgrounds) for the background shot.
    document.documentElement.setAttribute('data-contrast-probe', '');
    const st = document.createElement('style');
    st.id = 'contrast-probe';
    st.textContent = '[data-contrast-probe] *, [data-contrast-probe] *::before, [data-contrast-probe] *::after { color: transparent !important; -webkit-text-fill-color: transparent !important; caret-color: transparent !important; } [data-contrast-probe] ::placeholder { color: transparent !important; }';
    document.head.append(st);
    return out;
  }, root);
  await page.waitForTimeout(150);
  const png = (await page.screenshot()).toString('base64');
  await page.evaluate(() => { document.getElementById('contrast-probe')?.remove(); document.documentElement.removeAttribute('data-contrast-probe'); });

  const decoder = await page.context().newPage();
  await decoder.setContent('<canvas></canvas>');
  const results: { ratio: number }[] = await decoder.evaluate(async ({ png, items }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode();
    const c = document.querySelector('canvas')!; c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0);
    const lin = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const lum = (r: number, g: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return items.map((it: any) => {
      const [x0, y0, x1, y1] = it.box.map(Math.round);
      const d = ctx.getImageData(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0)).data;
      const ratios: number[] = [];
      for (let i = 0; i < d.length; i += 4 * 3) {
        const a = it.alpha, fr = it.rgb[0] * a + d[i] * (1 - a), fg = it.rgb[1] * a + d[i + 1] * (1 - a), fb = it.rgb[2] * a + d[i + 2] * (1 - a);
        const L1 = lum(fr, fg, fb), L2 = lum(d[i], d[i + 1], d[i + 2]);
        ratios.push((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05));
      }
      ratios.sort((a, b) => a - b);
      return { ratio: ratios[Math.floor(ratios.length * 0.1)] ?? 21 };
    });
  }, { png, items });
  await decoder.close();
  return items.map((it, i) => ({ theme, text: it.text, selector: it.selector, ratio: +results[i].ratio.toFixed(2), need: it.large ? 3 : 4.5, hidden: it.hidden }))
    .filter((r) => r.ratio < r.need);
}
