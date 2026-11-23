import { kvGet, kvSet } from '../core/kv';
import {
  RADIO_STATIONS,
  nextTrackIndex,
  type RadioStation,
  type RadioStationId,
  type RadioTrack,
} from './radio';
import { getRadioSlot, listRadioSlotIds } from './trackDb';

export const RADIO_KV_KEY = 'radio:last';

export type RadioMode = 'track' | 'playlist';
export type RadioSource = 'spotify' | 'mp3';

export interface SavedRadioState {
  stationId: RadioStationId;
  trackId: string;
  trackIndex: number;
  mode: RadioMode;
  elapsedSec: number;
  wasPlaying: boolean;
  updatedAt: number;
}

export interface RadioRuntimeState {
  hydrated: boolean;
  playing: boolean;
  paused: boolean;
  stationId: RadioStationId;
  trackIndex: number;
  trackId: string;
  mode: RadioMode;
  elapsedSec: number;
  durationSec: number;
  source: RadioSource;
  restoredFromSave: boolean;
  mp3Ids: readonly string[];
  stopEpoch: number;
}

export function cleanSavedRadioState(
  raw: unknown,
  stations: readonly RadioStation[],
): SavedRadioState | null {
  if (!raw || typeof raw !== 'object' || stations.length === 0) return null;
  const r = raw as Record<string, unknown>;
  const station = stations.find((st) => st.id === r.stationId) ?? stations[0];
  if (!station || station.tracks.length === 0) return null;

  let trackIndex = station.tracks.findIndex((t) => t.id === r.trackId);
  if (trackIndex < 0) {
    const idxNum = typeof r.trackIndex === 'number' && Number.isFinite(r.trackIndex) ? Math.floor(r.trackIndex) : 0;
    trackIndex = Math.max(0, Math.min(station.tracks.length - 1, idxNum));
  }
  const track = station.tracks[trackIndex];
  if (!track) return null;

  const elapsedSec =
    typeof r.elapsedSec === 'number' && Number.isFinite(r.elapsedSec)
      ? Math.max(0, Math.floor(r.elapsedSec))
      : 0;

  return {
    stationId: station.id,
    trackId: track.id,
    trackIndex,
    mode: r.mode === 'playlist' ? 'playlist' : 'track',
    elapsedSec,
    wasPlaying: r.wasPlaying === true,
    updatedAt: typeof r.updatedAt === 'number' && Number.isFinite(r.updatedAt) ? r.updatedAt : Date.now(),
  };
}

function readSyncLocalRadio(): unknown {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem('kv:' + RADIO_KV_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function defaultState(): RadioRuntimeState {
  const firstStation = RADIO_STATIONS[0];
  const firstTrack = firstStation?.tracks[0];
  return {
    hydrated: false,
    playing: false,
    paused: false,
    stationId: firstStation?.id ?? 'edgerunners',
    trackIndex: 0,
    trackId: firstTrack?.id ?? '',
    mode: 'track',
    elapsedSec: 0,
    durationSec: 180,
    source: 'spotify',
    restoredFromSave: false,
    mp3Ids: [],
    stopEpoch: 0,
  };
}

class RadioPlayer {
  private state: RadioRuntimeState = defaultState();
  private listeners = new Set<() => void>();
  private beforePlayHooks = new Set<() => void>();
  private currentVolume = 0.3;
  private playToken = 0;
  private lastPersistedSec = -1;

  // Local MP3 runtime refs
  private audioEl: HTMLAudioElement | null = null;
  private objectUrl = '';

  private notify(): void {
    for (const fn of this.listeners) fn();
  }

  private getStation(stationId: RadioStationId): RadioStation | undefined {
    return RADIO_STATIONS.find((s) => s.id === stationId) ?? RADIO_STATIONS[0];
  }

  private persist(wasPlaying = this.state.playing): void {
    if (!this.state.trackId) return;
    const payload: SavedRadioState = {
      stationId: this.state.stationId,
      trackId: this.state.trackId,
      trackIndex: this.state.trackIndex,
      mode: this.state.mode,
      elapsedSec: Math.max(0, Math.floor(this.state.elapsedSec)),
      wasPlaying,
      updatedAt: Date.now(),
    };
    this.lastPersistedSec = payload.elapsedSec;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('kv:' + RADIO_KV_KEY, JSON.stringify(payload));
      }
    } catch {}
    void kvSet(RADIO_KV_KEY, payload);
  }

  private clearLocalAudio(): void {
    if (this.audioEl) {
      this.audioEl.onloadedmetadata = null;
      this.audioEl.ontimeupdate = null;
      this.audioEl.onended = null;
      this.audioEl.onerror = null;
      try {
        this.audioEl.pause();
      } catch {}
      this.audioEl.removeAttribute('src');
      this.audioEl = null;
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

  async hydrate(): Promise<void> {
    if (RADIO_STATIONS.length === 0) {
      this.state = { ...this.state, hydrated: true };
      this.notify();
      return;
    }

    const [savedAsync, slotIds] = await Promise.all([
      kvGet<SavedRadioState>(RADIO_KV_KEY),
      listRadioSlotIds(),
    ]);

    const cleaned =
      cleanSavedRadioState(savedAsync, RADIO_STATIONS) ??
      cleanSavedRadioState(readSyncLocalRadio(), RADIO_STATIONS);

    if (cleaned && !this.state.playing && !this.state.paused) {
      this.state = {
        ...this.state,
        hydrated: true,
        stationId: cleaned.stationId,
        trackIndex: cleaned.trackIndex,
        trackId: cleaned.trackId,
        mode: cleaned.mode,
        elapsedSec: cleaned.elapsedSec,
        source: slotIds.includes(cleaned.trackId) ? 'mp3' : 'spotify',
        restoredFromSave: true,
        mp3Ids: slotIds,
      };
    } else {
      this.state = {
        ...this.state,
        hydrated: true,
        source: slotIds.includes(this.state.trackId) ? 'mp3' : 'spotify',
        mp3Ids: slotIds,
      };
    }
    this.notify();
  }

  async refreshSlots(): Promise<void> {
    const slotIds = await listRadioSlotIds();
    const activeHasMp3 = slotIds.includes(this.state.trackId);
    const prevSource = this.state.source;
    const nextSource: RadioSource = activeHasMp3 ? 'mp3' : 'spotify';

    this.state = {
      ...this.state,
      mp3Ids: slotIds,
      source: nextSource,
    };
    this.notify();

    if (prevSource !== nextSource) {
      void this.playTrack(this.state.stationId, this.state.trackIndex, this.currentVolume, 0);
    }
  }

  async selectTrack(
    stationId: RadioStationId,
    trackIndex: number,
    volume: number,
    startAtSec = 0,
  ): Promise<boolean> {
    const st = this.getStation(stationId);
    if (!st || st.tracks.length === 0) return false;

    const bounded = Math.max(0, Math.min(st.tracks.length - 1, trackIndex));
    const track: RadioTrack = st.tracks[bounded]!;

    this.clearLocalAudio();
    this.currentVolume = Math.max(0, Math.min(1, volume));
    const token = ++this.playToken;
    const hasMp3 = this.state.mp3Ids.includes(track.id);

    this.state = {
      ...this.state,
      hydrated: true,
      playing: hasMp3,
      paused: false,
      stationId: st.id,
      trackIndex: bounded,
      trackId: track.id,
      mode: 'track',
      elapsedSec: Math.max(0, Math.floor(startAtSec)),
      source: hasMp3 ? 'mp3' : 'spotify',
      restoredFromSave: false,
    };
    this.persist(hasMp3);
    this.notify();

    if (!hasMp3) return true;

    const slot = await getRadioSlot(track.id);
    if (token !== this.playToken || !slot || typeof Audio === 'undefined') {
      return true;
    }

    for (const hook of this.beforePlayHooks) hook();
    this.objectUrl = URL.createObjectURL(slot.blob);
    const el = new Audio(this.objectUrl);
    el.volume = this.currentVolume;
    el.onloadedmetadata = () => {
      if (token !== this.playToken) return;
      const dur = Number.isFinite(el.duration) && el.duration > 0 ? Math.round(el.duration) : 180;
      if (startAtSec > 0 && startAtSec < dur - 2) {
        try {
          el.currentTime = startAtSec;
        } catch {}
      }
      this.state = { ...this.state, durationSec: dur, source: 'mp3' };
      this.notify();
    };
    el.ontimeupdate = () => {
      if (token !== this.playToken) return;
      const sec = Math.floor(el.currentTime);
      if (sec !== this.state.elapsedSec) {
        this.state = { ...this.state, elapsedSec: sec };
        if (Math.abs(sec - this.lastPersistedSec) >= 5) {
          this.persist(true);
        }
        this.notify();
      }
    };
    el.onended = () => {
      if (token !== this.playToken) return;
      this.next(this.currentVolume);
    };
    el.onerror = () => {
      if (token !== this.playToken) return;
      this.next(this.currentVolume);
    };
    this.audioEl = el;
    void el.play().catch(() => {
      if (token !== this.playToken) return;
      this.state = { ...this.state, playing: false, paused: true };
      this.persist(false);
      this.notify();
    });
    return true;
  }

  playTrack(
    stationId: RadioStationId,
    trackIndex: number,
    volume: number,
    startAtSec = 0,
  ): Promise<boolean> {
    return this.selectTrack(stationId, trackIndex, volume, startAtSec);
  }

  selectStation(stationId: RadioStationId, volume: number): void {
    const st = this.getStation(stationId);
    if (!st || st.tracks.length === 0) return;

    const alreadyActive = this.state.stationId === st.id;
    const nextIdx = alreadyActive ? this.state.trackIndex : 0;
    const track = st.tracks[nextIdx]!;
    const hasMp3 = this.state.mp3Ids.includes(track.id);

    if (hasMp3 && this.state.mode === 'track') {
      void this.selectTrack(st.id, nextIdx, volume, 0);
      return;
    }

    this.clearLocalAudio();
    this.state = {
      ...this.state,
      playing: false,
      paused: false,
      stationId: st.id,
      trackIndex: nextIdx,
      trackId: track.id,
      elapsedSec: alreadyActive ? this.state.elapsedSec : 0,
      source: hasMp3 ? 'mp3' : 'spotify',
      restoredFromSave: false,
    };
    this.persist(false);
    this.notify();
  }

  setMode(mode: RadioMode, volume: number): void {
    if (this.state.mode === mode) return;
    if (mode === 'playlist') {
      this.playToken++;
      this.clearLocalAudio();
      this.state = { ...this.state, mode, playing: false, paused: false };
      this.persist(false);
      this.notify();
      return;
    }
    this.state = { ...this.state, mode: 'track' };
    this.persist(this.state.playing);
    this.notify();
    if (this.state.mp3Ids.includes(this.state.trackId)) {
      void this.selectTrack(this.state.stationId, this.state.trackIndex, volume, this.state.elapsedSec);
    }
  }

  setEmbedPlaying(isPlaying: boolean): void {
    if (this.state.mode !== 'playlist' && this.state.source !== 'spotify') return;
    if (isPlaying && !this.state.playing) {
      for (const hook of this.beforePlayHooks) hook();
    }
    if (this.state.playing === isPlaying && !this.state.restoredFromSave) return;
    this.state = { ...this.state, playing: isPlaying, restoredFromSave: false };
    this.persist(isPlaying);
    this.notify();
  }

  togglePlayPause(volume: number): void {
    if (this.state.source !== 'mp3') return;
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.audioEl) {
      if (this.audioEl.paused) {
        for (const hook of this.beforePlayHooks) hook();
        this.audioEl.volume = this.currentVolume;
        void this.audioEl.play().catch(() => {});
        this.state = { ...this.state, playing: true, paused: false, restoredFromSave: false };
        this.persist(true);
        this.notify();
      } else {
        this.audioEl.pause();
        this.state = { ...this.state, playing: false, paused: true };
        this.persist(false);
        this.notify();
      }
      return;
    }
    const resumeAt = this.state.paused || this.state.restoredFromSave ? this.state.elapsedSec : 0;
    void this.selectTrack(this.state.stationId, this.state.trackIndex, volume, resumeAt);
  }

  next(volume: number): void {
    const st = this.getStation(this.state.stationId);
    if (!st || st.tracks.length === 0) return;
    const nextIdx = nextTrackIndex(this.state.trackIndex, st.tracks.length, 1);
    void this.selectTrack(st.id, nextIdx, volume, 0);
  }

  prev(volume: number): void {
    const st = this.getStation(this.state.stationId);
    if (!st || st.tracks.length === 0) return;
    const prevIdx = nextTrackIndex(this.state.trackIndex, st.tracks.length, -1);
    void this.selectTrack(st.id, prevIdx, volume, 0);
  }

  setVolume(volume: number): void {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.audioEl) {
      this.audioEl.volume = this.currentVolume;
    }
  }

  stop(): void {
    if (!this.state.playing && !this.state.paused && !this.audioEl) return;
    this.playToken++;
    this.clearLocalAudio();
    this.state = {
      ...this.state,
      playing: false,
      paused: false,
      stopEpoch: this.state.stopEpoch + 1,
    };
    this.persist(false);
    this.notify();
  }

  persistAndPause(): void {
    const wasActive = this.state.playing || this.state.paused;
    this.persist(wasActive);
    this.playToken++;
    this.clearLocalAudio();
    this.state = { ...this.state, playing: false, paused: wasActive };
  }

  getState(): RadioRuntimeState {
    return this.state;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const radioPlayer = new RadioPlayer();
