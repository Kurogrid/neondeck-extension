// Toolbar button: opens NEONDECK in a new tab. Browsers that keep their own
// new tab page (Opera's Speed Dial) ignore chrome_url_overrides, so this is
// how users reach the dashboard there. tabs.create needs no extra permission.
const ext = globalThis.browser ?? globalThis.chrome;
ext.action.onClicked.addListener(() => {
  ext.tabs.create({ url: ext.runtime.getURL('index.html') });
});

// First install only (not updates): open the setup guide.
ext.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') ext.tabs.create({ url: ext.runtime.getURL('welcome.html') });
});
