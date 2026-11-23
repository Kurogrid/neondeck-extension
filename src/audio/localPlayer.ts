import type { LocalTrack } from './trackDb';

export interface LocalPlayerState {
  playing: boolean;
  paused: boolean;
  trackId: string | null;
  title: string;
}

class LocalPlayer {
  private audio: HTMLAudioElement | null = null;
  private objectUrl = '';
  private playlist: readonly LocalTrack[] = [];
  private currentVolume = 0.3;
  private state: LocalPlayerState = { playing: false, paused: false, trackId: null, title: '' };
  private listeners = new Set<() => void>();
  private beforePlayHooks = new Set<() => void>();

  private notify(): void {
    for (const fn of this.listeners) fn();
  }

  private clearAudio(): void {
    if (this.audio) {
      this.audio.onended = null;
      this.audio.onerror = null;
      try { this.audio.pause(); } catch {}
      this.audio.removeAttribute('src');
      this.audio = null;
    }
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = '';
    }
  }

  onBeforePlay(fn: () => void): () => void {
    this.beforePlayHooks.add(fn);
    return () => this.beforePlayHooks.delete(fn);
  }

  setPlaylist(tracks: readonly LocalTrack[]): void {
    this.playlist = tracks;
    if (this.state.trackId && !tracks.some((t) => t.id === this.state.trackId)) {
      this.stop();
    }
  }

  playById(id: string, volume: number): boolean {
    const item = this.playlist.find((t) => t.id === id);
    if (!item || typeof Audio === 'undefined') return false;

    for (const hook of this.beforePlayHooks) hook();
    this.clearAudio();

    this.currentVolume = Math.max(0, Math.min(1, volume));
    this.objectUrl = URL.createObjectURL(item.blob);
    const el = new Audio(this.objectUrl);
    el.volume = this.currentVolume;
    el.onended = () => {
      if (this.playlist.length > 1) this.next(this.currentVolume);
      else this.stop();
    };
    el.onerror = () => this.stop();
    this.audio = el;

    this.state = { playing: true, paused: false, trackId: item.id, title: item.title };
    this.notify();

    void el.play().catch(() => {
      this.state = { playing: false, paused: true, trackId: item.id, title: item.title };
      this.notify();
    });
    return true;
  }

  togglePlayPause(volume: number): void {
    if (!this.playlist.length) return;
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.audio && this.state.trackId) {
      if (this.audio.paused) {
        for (const hook of this.beforePlayHooks) hook();
        this.audio.volume = this.currentVolume;
        void this.audio.play().catch(() => {});
        this.state = { ...this.state, playing: true, paused: false };
        this.notify();
      } else {
        this.audio.pause();
        this.state = { ...this.state, playing: false, paused: true };
        this.notify();
      }
      return;
    }
    this.playById(this.playlist[0]!.id, volume);
  }

  next(volume: number): void {
    if (!this.playlist.length) return;
    const idx = this.playlist.findIndex((t) => t.id === this.state.trackId);
    const nextItem = this.playlist[(idx + 1) % this.playlist.length]!;
    this.playById(nextItem.id, volume);
  }

  prev(volume: number): void {
    if (!this.playlist.length) return;
    const idx = this.playlist.findIndex((t) => t.id === this.state.trackId);
    const prevIdx = idx <= 0 ? this.playlist.length - 1 : idx - 1;
    this.playById(this.playlist[prevIdx]!.id, volume);
  }

  setVolume(volume: number): void {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.audio) this.audio.volume = this.currentVolume;
  }

  stop(): void {
    if (!this.audio && !this.state.playing && !this.state.trackId) return;
    this.clearAudio();
    this.state = { playing: false, paused: false, trackId: null, title: '' };
    this.notify();
  }

  getState(): LocalPlayerState {
    return this.state;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const localPlayer = new LocalPlayer();
