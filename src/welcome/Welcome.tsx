import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { THEME_IDS, type Locale, type Settings, type ThemeId } from '../core/schema';
import { loadSettings, saveSettings } from '../core/storage';
import { applyTheme } from '../core/theme-engine';
import { t } from '../core/i18n';
import { ext } from '../core/ext';
import { Icon } from '../components/Icon';
import { BROWSERS, detectBrowser, type BrowserId } from './browser';
import { BROWSER_LABEL, browserStepKey, wt } from './text';

const deckUrl = () => ext?.runtime?.getURL?.('index.html') ?? new URL('index.html', location.href).href;

function Step({ n, L, title, children }: { n: number; L: Locale; title: string; children: ComponentChildren }) {
  return (
    <section class="nd-wl-step nd-chamfer">
      <p class="nd-wl-step__num">{wt(L, 'stepOf', { n })}</p>
      <h2 class="nd-wl-step__title">{title}</h2>
      {children}
    </section>
  );
}

// Opera keeps its own start page and its store rules forbid replacing it, so only the toolbar route is shown.
function OperaSteps({ L }: { L: Locale }) {
  return (
    <>
      <p>{wt(L, 's1_opera')}</p>
      <ol class="nd-wl-list">
        <li>{wt(L, 's1_opera1')}</li>
        <li>{wt(L, 's1_opera2')}</li>
      </ol>
    </>
  );
}

export function Welcome() {
  const [s, setS] = useState<Settings | null>(null);
  const [L, setL] = useState<Locale>('en');
  const detected = detectBrowser(navigator.userAgent, typeof (globalThis as { browser?: unknown }).browser !== 'undefined');
  const [browser, setBrowser] = useState<BrowserId>(detected);

  useEffect(() => {
    void loadSettings().then((v) => { setS(v); setL(v.profile.locale); applyTheme(document.documentElement, v); });
  }, []);
  useEffect(() => {
    document.documentElement.lang = L;
    document.title = wt(L, 'pageTitle');
  }, [L]);

  const pickTheme = (id: ThemeId) => {
    if (!s) return;
    const next = structuredClone(s);
    next.theme.id = id;
    setS(next);
    applyTheme(document.documentElement, next);
    void saveSettings(next);
  };
  const toggleLang = () => setL(L === 'tr' ? 'en' : 'tr');

  return (
    <div class="nd-wl">
      <header class="nd-wl-hero">
        <button type="button" class="nd-btn nd-btn--sm nd-btn--ghost nd-wl-lang" onClick={toggleLang} lang={L === 'tr' ? 'en' : 'tr'}>{wt(L, 'langSwitch')}</button>
        <p class="nd-wl-kicker">{wt(L, 'kicker')}</p>
        <h1 class="nd-wl-title">{wt(L, 'title')}</h1>
        <p class="nd-wl-lead">{wt(L, 'lead')}</p>
        <a class="nd-btn nd-btn--primary nd-chamfer" href={deckUrl()}>{wt(L, 'openDeck')}</a>
      </header>

      <main class="nd-wl-steps">
        <Step n={1} L={L} title={wt(L, 's1Title')}>
          <div class="nd-wl-tabs" role="tablist">
            {BROWSERS.map((b) => (
              <button key={b} type="button" role="tab" aria-selected={browser === b} class="nd-wl-tab" onClick={() => setBrowser(b)}>
                {BROWSER_LABEL[b]}{b === detected && <small> · {wt(L, 'yourBrowser')}</small>}
              </button>
            ))}
          </div>
          <div role="tabpanel" class="nd-wl-panel">
            {browser === 'opera' ? <OperaSteps L={L} /> : <p>{wt(L, browserStepKey(browser))}</p>}
          </div>
          <p class="nd-wl-tip">{wt(L, 'pinTip')}</p>
        </Step>

        <Step n={2} L={L} title={wt(L, 's2Title')}>
          <p>{wt(L, 's2Body')}</p>
          <div class="nd-wl-themes">
            {THEME_IDS.map((id) => (
              <button key={id} type="button" data-theme={id} class="nd-wl-theme nd-chamfer" aria-pressed={s?.theme.id === id} disabled={!s} onClick={() => pickTheme(id)}>
                <span class="nd-wl-theme__sw" aria-hidden="true"><i class="pri" /><i class="sec" /><i class="acc" /></span>
                <span class="nd-wl-theme__name">{t(L, `theme_${id}`)}</span>
                {s?.theme.id === id && <span class="nd-wl-theme__on">{wt(L, 'active')}</span>}
              </button>
            ))}
          </div>
        </Step>

        <Step n={3} L={L} title={wt(L, 's3Title')}><p>{wt(L, 's3Body')}</p></Step>
        <Step n={4} L={L} title={wt(L, 's4Title')}><p>{wt(L, 's4Body')}</p></Step>
        <Step n={5} L={L} title={wt(L, 's5Title')}><p>{wt(L, 's5Body')}</p></Step>
        <Step n={6} L={L} title={wt(L, 's6Title')}><p>{wt(L, 's6Body')}</p></Step>
        <Step n={7} L={L} title={wt(L, 's7Title')}><p>{wt(L, 's7Body')}</p></Step>

        <section class="nd-wl-privacy nd-chamfer">
          <h2 class="nd-wl-step__title"><Icon name="shield" /> {wt(L, 'privacyTitle')}</h2>
          <p>{wt(L, 'privacyBody')}</p>
        </section>
      </main>

      <footer class="nd-wl-foot">
        <a class="nd-btn nd-btn--primary nd-chamfer" href={deckUrl()}>{wt(L, 'openDeck')}</a>
        <p>{wt(L, 'footer')}</p>
      </footer>
    </div>
  );
}
