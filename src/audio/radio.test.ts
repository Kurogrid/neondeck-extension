import { describe, expect, it } from 'vitest';
import {
  RADIO_STATIONS,
  cleanSavedRadioState,
  createRadioTrack,
  matchFilenameToTrack,
  nextTrackIndex,
  normalizeTrackName,
  radioPlayer,
  type RadioStation,
} from './index';

const MOCK_STATIONS: readonly RadioStation[] = [
  {
    id: 'edgerunners',
    name: 'Edgerunners Radio',
    subtitle: { en: 'Anime', tr: 'Anime' },
    spotifyPlaylistId: '1XAiAEkhpzxUk6sjby32sh',
    tracks: [
      createRadioTrack('er-01', 'edgerunners', 0, 'I Really Want to Stay at Your House', 'Rosa Walton & Hallie Coggins', '7mykoq6R3BArsSpNDjFQTm'),
      createRadioTrack('er-02', 'edgerunners', 1, 'This Fffire', 'Franz Ferdinand', '6WkBM8cOY4aREMoPDB8gTK'),
    ],
  },
  {
    id: '2077',
    name: '2077 Radio',
    subtitle: { en: 'Night City', tr: 'Night City' },
    spotifyPlaylistId: '5rn1uqM3yaXf15HBAJEzs4',
    tracks: [
      createRadioTrack('cp-01', '2077', 0, 'V', 'Marcin Przybyłowicz', '2u1FWVxAb16qbgwPgygAdj'),
      createRadioTrack('cp-02', '2077', 1, 'Never Fade Away', 'SAMURAI & Refused', '1AslaQYl1cMb1ItQKmtJer'),
      createRadioTrack('cp-04', '2077', 2, '4ÆM', 'Grimes', '3qKAXiugkeDQPWyXm0fMnt'),
    ],
  },
];

describe('radio playlist helpers', () => {
  it('wraps track indices sequentially forwards and backwards', () => {
    expect(nextTrackIndex(0, 10, 1)).toBe(1);
    expect(nextTrackIndex(9, 10, 1)).toBe(0);
    expect(nextTrackIndex(0, 10, -1)).toBe(9);
    expect(nextTrackIndex(4, 10, -1)).toBe(3);
    expect(nextTrackIndex(0, 0, 1)).toBe(0);
  });

  it('normalizes filenames and strips track numbers and accents', () => {
    expect(normalizeTrackName('03 - Dawid Podsiadło - Let You Down.mp3')).toBe('dawid podsiadlo let you down');
    expect(normalizeTrackName('08. Grimes - 4ÆM (Night City).flac')).toBe('grimes 4aem night city');
  });

  it('matches uploaded audio filenames to the right station track', () => {
    const allMock = MOCK_STATIONS.flatMap((s) => s.tracks);
    expect(matchFilenameToTrack('01_Rosa_Walton_Stay_at_Your_House.mp3', allMock)?.id).toBe('er-01');
    expect(matchFilenameToTrack('Refused - Never Fade Away (SAMURAI).ogg', allMock)?.id).toBe('cp-02');
    expect(matchFilenameToTrack('Marcin Przybylowicz - V.mp3', allMock)?.id).toBe('cp-01');
    expect(matchFilenameToTrack('Grimes - 4AEM.mp3', allMock)?.id).toBe('cp-04');
    expect(matchFilenameToTrack('random-podcast-episode.mp3', allMock)).toBeNull();
  });

  it('sanitizes and restores last played station, track, mode, and elapsed seconds', () => {
    const clean = cleanSavedRadioState(
      {
        stationId: '2077',
        trackId: 'cp-02',
        trackIndex: 99,
        mode: 'playlist',
        elapsedSec: 47.8,
        wasPlaying: true,
        updatedAt: 123456,
      },
      MOCK_STATIONS,
    );
    expect(clean).toEqual({
      stationId: '2077',
      trackId: 'cp-02',
      trackIndex: 1,
      mode: 'playlist',
      elapsedSec: 47,
      wasPlaying: true,
      updatedAt: 123456,
    });

    const fallback = cleanSavedRadioState(
      { stationId: 'unknown', trackId: 'missing', trackIndex: 1, mode: 'other', elapsedSec: -10 },
      MOCK_STATIONS,
    );
    expect(fallback?.stationId).toBe('edgerunners');
    expect(fallback?.trackId).toBe('er-02');
    expect(fallback?.mode).toBe('track');
    expect(fallback?.elapsedSec).toBe(0);
  });

  if (RADIO_STATIONS.length > 0) {
    it('exposes Edgerunners Radio and 2077 Radio with 10 verified Spotify tracks each', () => {
      expect(RADIO_STATIONS.map((s) => s.id)).toEqual(['edgerunners', '2077']);
      for (const st of RADIO_STATIONS) {
        expect(st.spotifyPlaylistId).toMatch(/^[A-Za-z0-9]{22}$/);
        expect(st.tracks).toHaveLength(10);
        for (const tr of st.tracks) {
          expect(tr.spotifyId).toMatch(/^[A-Za-z0-9]{22}$/);
          expect(tr.spotifyUrl).toBe(`https://open.spotify.com/track/${tr.spotifyId}`);
        }
      }
      const ids = RADIO_STATIONS.flatMap((s) => s.tracks.map((t) => t.id));
      expect(new Set(ids).size).toBe(20);
    });

    it('tracks embed playback across track/playlist modes and bumps stopEpoch on stop', async () => {
      const beforeEpoch = radioPlayer.getState().stopEpoch;
      radioPlayer.setEmbedPlaying(true);
      expect(radioPlayer.getState().playing).toBe(true);

      radioPlayer.stop();
      expect(radioPlayer.getState().playing).toBe(false);
      expect(radioPlayer.getState().stopEpoch).toBe(beforeEpoch + 1);

      radioPlayer.setMode('playlist', 0.4);
      radioPlayer.setEmbedPlaying(true);
      expect(radioPlayer.getState().mode).toBe('playlist');
      expect(radioPlayer.getState().playing).toBe(true);

      radioPlayer.stop();
      expect(radioPlayer.getState().playing).toBe(false);
      expect(radioPlayer.getState().stopEpoch).toBe(beforeEpoch + 2);
      radioPlayer.setMode('track', 0.4);
    });
  }
});
