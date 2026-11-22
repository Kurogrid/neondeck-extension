import { t, type MsgKey } from '../core/i18n';
import type { Locale } from '../core/schema';

/** Audio UI strings live in the shared dictionary (src/core/i18n.ts) under `audio_*` keys. */
export type AudioKey = 'secAudio' | 'uiSfx' | 'sfxVolume' | 'ambientTrack' | 'ambVolume' | 'track_off' | 'track_rain' | 'track_synthwave' | 'ambPlay' | 'ambStop' | 'ambPlaying' | 'ambReady' | 'ambOff' | 'ambNote';

export const audioText = (locale: Locale, key: AudioKey): string => t(locale, `audio_${key}` as MsgKey);
