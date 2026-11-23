import { t, type MsgKey } from '../core/i18n';
import type { Locale } from '../core/schema';

/** Audio UI strings live in the shared dictionary (src/core/i18n.ts) under `audio_*` keys. */
export type AudioKey =
  | 'secAudio'
  | 'uiSfx'
  | 'sfxVolume'
  | 'ambientTrack'
  | 'ambVolume'
  | 'track_off'
  | 'track_rain'
  | 'track_synthwave'
  | 'track_edgerunners'
  | 'track_arasaka'
  | 'track_samurai'
  | 'track_ghost'
  | 'track_orchid'
  | 'ambPlay'
  | 'ambStop'
  | 'ambPlaying'
  | 'ambReady'
  | 'ambOff'
  | 'ambNote'
  | 'tabSynth'
  | 'tabLocal'
  | 'tabRadio'
  | 'localUpload'
  | 'localEmpty'
  | 'localErrType'
  | 'localErrSize'
  | 'localErrStore'
  | 'prevTrack'
  | 'nextTrack'
  | 'removeTrack'
  | 'radioHint'
  | 'radioTitle'
  | 'radioResume'
  | 'radioLastSaved'
  | 'radioMatchMp3'
  | 'radioMatched'
  | 'radioAttachMp3'
  | 'radioClearMp3'
  | 'radioSourceSynth'
  | 'radioSourceMp3'
  | 'radioSourceSpotify'
  | 'radioModeTracks'
  | 'radioModePlaylist'
  | 'radioOpen'
  | 'radioSeqHint';

export const audioText = (
  locale: Locale,
  key: AudioKey,
  vars?: Record<string, string | number>,
): string => t(locale, `audio_${key}` as MsgKey, vars);
