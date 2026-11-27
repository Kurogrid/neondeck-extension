import type { Locale } from '../core/schema';
import type { BrowserId } from './browser';

/** Welcome-page copy. Kept apart from core/i18n so the new tab doesn't carry it. */
const en = {
  pageTitle: 'Welcome to NEONDECK',
  kicker: 'SYSTEM ONLINE',
  title: 'NEONDECK is installed',
  lead: 'Your browser now has a cyberpunk command deck. This short guide shows where everything is. It takes about a minute.',
  openDeck: 'Open NEONDECK',
  langSwitch: 'Türkçe',
  stepOf: 'STEP {n}',
  // step 1
  s1Title: 'Open a new tab',
  yourBrowser: 'your browser',
  s1_chrome: 'Press Ctrl+T (⌘T on Mac). If Chrome asks whether you wanted this new tab page, choose to keep it. Choosing "change it back" turns NEONDECK off.',
  s1_edge: 'Press Ctrl+T. If Edge says an extension changed your new tab page, choose to keep the changes.',
  s1_firefox: 'Press Ctrl+T (⌘T on Mac). If Firefox says an extension changed your new tab page, click "Keep Changes".',
  s1_opera: 'Opera keeps its own Speed Dial as the new tab, so NEONDECK opens from the toolbar instead:',
  s1_opera1: 'Click the cube icon in the toolbar, find NEONDECK and pin it.',
  s1_opera2: 'Click the NEONDECK button any time to open the deck in a new tab.',
  pinTip: 'Tip: pin the NEONDECK button in the toolbar. One click opens the deck in any browser.',
  // step 2
  s2Title: 'Pick your theme',
  s2Body: 'Each theme has its own colors, live backgrounds and music. Click one to try it, you can change it later in Settings.',
  active: 'Active',
  // step 3+
  s3Title: 'Search fast',
  s3Body: 'Press / anywhere to jump to the search bar. Pick an engine next to it, or add your own under Settings → Search engines.',
  s4Title: 'Add your netlinks',
  s4Body: 'Use "Add link" to save the sites you visit most. Keys 1–9 open your first nine links. To bring in browser bookmarks, use Settings → Permissions → Import bookmarks.',
  s5Title: 'Open the widget panel',
  s5Body: 'The WIDGETS button at the top right opens the side panel. Use the pencil to add weather, world clocks, notes, tasks and habits, Pomodoro and more.',
  s6Title: 'Turn on the sound (optional)',
  s6Body: 'NEONDECK never plays audio on its own. Under Settings → Audio you can switch on UI sounds and press Play for theme music or ambient sound.',
  s7Title: 'Make it yours',
  s7Body: 'The IDENTITY button at the top left opens Settings: your name, language, wallpapers (including your own images), scanlines, glitch effects and a low power mode.',
  privacyTitle: 'Private by design',
  privacyBody: 'No account and no tracking. NEONDECK only asks for storage. Bookmarks and favicons are asked for only when you click. Your settings stay in your browser, and you can back them up as JSON under Settings → Data.',
  footer: 'You can reopen this guide any time from Settings → Data.',
};

type Text = typeof en;

const tr: Text = {
  pageTitle: 'NEONDECK’e hoş geldin',
  kicker: 'SİSTEM ÇEVRİMİÇİ',
  title: 'NEONDECK kuruldu',
  lead: 'Tarayıcına cyberpunk bir komuta paneli eklendi. Bu kısa kılavuz her şeyin nerede olduğunu gösteriyor, yaklaşık bir dakika sürer.',
  openDeck: 'NEONDECK’i aç',
  langSwitch: 'English',
  stepOf: 'ADIM {n}',
  s1Title: 'Yeni sekme aç',
  yourBrowser: 'senin tarayıcın',
  s1_chrome: 'Ctrl+T’ye bas (Mac’te ⌘T). Chrome bu yeni sekme sayfasını isteyip istemediğini sorarsa korumayı seç. "Geri değiştir" dersen NEONDECK kapanır.',
  s1_edge: 'Ctrl+T’ye bas. Edge bir eklentinin yeni sekme sayfanı değiştirdiğini söylerse değişiklikleri korumayı seç.',
  s1_firefox: 'Ctrl+T’ye bas (Mac’te ⌘T). Firefox bir eklentinin yeni sekmeni değiştirdiğini söylerse "Değişiklikleri koru"ya tıkla.',
  s1_opera: 'Opera yeni sekmede kendi Hızlı Erişim sayfasını tutuyor. Bu yüzden NEONDECK araç çubuğundan açılır:',
  s1_opera1: 'Araç çubuğundaki küp simgesine tıkla, NEONDECK’i bul ve sabitle.',
  s1_opera2: 'NEONDECK düğmesine her tıkladığında panel yeni bir sekmede açılır.',
  pinTip: 'İpucu: NEONDECK düğmesini araç çubuğuna sabitle. Hangi tarayıcıda olursan ol tek tıkla açılır.',
  s2Title: 'Temanı seç',
  s2Body: 'Her temanın kendi renkleri, canlı arka planları ve müziği var. Denemek için birine tıkla, sonra Ayarlar’dan değiştirebilirsin.',
  active: 'Etkin',
  s3Title: 'Hızlı ara',
  s3Body: 'Her yerde / tuşuna basınca arama çubuğuna geçersin. Yanındaki seçiciden arama motorunu seç ya da Ayarlar → Arama motorları’ndan kendi motorunu ekle.',
  s4Title: 'Netlink’lerini ekle',
  s4Body: 'En sık girdiğin siteleri "Bağlantı ekle" ile kaydet. 1–9 tuşları ilk dokuz bağlantını açar. Tarayıcı yer imlerini almak için Ayarlar → İzinler → Yer imlerini içe aktar.',
  s5Title: 'Widget panelini aç',
  s5Body: 'Sağ üstteki WIDGET’LAR düğmesi yan paneli açar. Kalem simgesiyle hava durumu, dünya saatleri, notlar, görev ve alışkanlıklar, Pomodoro ve daha fazlasını ekle.',
  s6Title: 'Sesi aç (isteğe bağlı)',
  s6Body: 'NEONDECK kendiliğinden ses çalmaz. Ayarlar → Ses bölümünden arayüz seslerini açabilir, tema müziği ya da ortam sesi için Oynat’a basabilirsin.',
  s7Title: 'Kendine göre ayarla',
  s7Body: 'Sol üstteki KİMLİK düğmesi Ayarlar’ı açar: adın, dil, duvar kâğıtları (kendi görsellerin dahil), tarama çizgileri, glitch efektleri ve düşük güç modu.',
  privacyTitle: 'Gizlilik baştan tasarımda',
  privacyBody: 'Hesap yok, takip yok. NEONDECK yalnızca depolama izni ister. Yer imleri ve site simgeleri ancak sen tıklayınca istenir. Ayarların tarayıcında kalır, Ayarlar → Veri bölümünden JSON olarak yedekleyebilirsin.',
  footer: 'Bu kılavuzu istediğin zaman Ayarlar → Veri bölümünden yeniden açabilirsin.',
};

const dict: Record<Locale, Text> = { en, tr };
export type WelcomeKey = keyof Text;
export const wt = (l: Locale, k: WelcomeKey, vars: Record<string, string | number> = {}) =>
  dict[l][k].replace(/\{(\w+)\}/g, (_, v: string) => String(vars[v] ?? ''));
export const browserStepKey = (b: BrowserId): WelcomeKey => `s1_${b}`;
export const BROWSER_LABEL: Record<BrowserId, string> = { chrome: 'Chrome', edge: 'Edge', opera: 'Opera / GX', firefox: 'Firefox' };
