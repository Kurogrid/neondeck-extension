import { ambientEngine } from './ambient';
import { localPlayer } from './localPlayer';
import { radioPlayer } from './radioPlayer';

// Mutual exclusion: starting any audio engine stops the other two.
ambientEngine.onBeforeStart(() => {
  localPlayer.stop();
  radioPlayer.stop();
});
localPlayer.onBeforePlay(() => {
  ambientEngine.stop();
  radioPlayer.stop();
});
radioPlayer.onBeforePlay(() => {
  ambientEngine.stop();
  localPlayer.stop();
});

export { AMBIENT_TRACKS, type AmbientTrack } from '../core/schema';
export { ambientEngine, type AmbientRuntimeState } from './ambient';
export { closeAudioContext } from './context';
export { audioText } from './labels';
export { localPlayer, type LocalPlayerState } from './localPlayer';
export {
  RADIO_STATIONS,
  RADIO_TRACKS,
  createRadioTrack,
  matchFilenameToTrack,
  nextTrackIndex,
  normalizeTrackName,
  type RadioStation,
  type RadioStationId,
  type RadioTrack,
} from './radio';
export {
  RADIO_KV_KEY,
  cleanSavedRadioState,
  radioPlayer,
  type RadioMode,
  type RadioRuntimeState,
  type RadioSource,
  type SavedRadioState,
} from './radioPlayer';
export { playSfx, type SfxKind } from './sfx';
export {
  AUDIO_ACCEPT_MIME,
  MAX_AUDIO_BYTES,
  deleteLocalTrack,
  deleteRadioSlot,
  getRadioSlot,
  listLocalTracks,
  listRadioSlotIds,
  saveLocalTrack,
  saveRadioSlot,
  type LocalTrack,
  type RadioSlotAudio,
} from './trackDb';
