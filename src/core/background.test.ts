import { afterEach, describe, expect, it, vi } from 'vitest';

// Plain path string: the script is a classic (non-module) file served from public/.
const SCRIPT = '../../public/background.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function load(name: 'chrome' | 'browser') {
  let onClick: (() => void) | undefined;
  let onInstalled: ((d: { reason: string }) => void) | undefined;
  const api = {
    action: { onClicked: { addListener: (fn: () => void) => { onClick = fn; } } },
    tabs: { create: vi.fn() },
    runtime: {
      getURL: (p: string) => `chrome-extension://id/${p}`,
      onInstalled: { addListener: (fn: (d: { reason: string }) => void) => { onInstalled = fn; } },
    },
  };
  vi.stubGlobal('browser', name === 'browser' ? api : undefined);
  vi.stubGlobal('chrome', name === 'chrome' ? api : undefined);
  await import(/* @vite-ignore */ SCRIPT);
  return { api, click: () => onClick?.(), installed: (reason: string) => onInstalled?.({ reason }) };
}

describe('background script', () => {
  it.each(['chrome', 'browser'] as const)('toolbar button opens the dashboard (%s API)', async (name) => {
    const { api, click } = await load(name);
    expect(api.tabs.create).not.toHaveBeenCalled();
    click();
    expect(api.tabs.create).toHaveBeenCalledWith({ url: 'chrome-extension://id/index.html' });
  });

  it('opens the setup guide on first install only', async () => {
    const { api, installed } = await load('chrome');
    installed('update');
    installed('chrome_update');
    expect(api.tabs.create).not.toHaveBeenCalled();
    installed('install');
    expect(api.tabs.create).toHaveBeenCalledWith({ url: 'chrome-extension://id/welcome.html' });
  });
});
