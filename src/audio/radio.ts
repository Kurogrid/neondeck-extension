export type RadioStationId = 'edgerunners' | '2077';

export interface RadioTrack {
  id: string;
  stationId: RadioStationId;
  index: number;
  title: string;
  artist: string;
  spotifyId: string;
  spotifyUrl: string;
  ytMusicUrl: string;
}

export interface RadioStation {
  id: RadioStationId;
  name: string;
  subtitle: { en: string; tr: string };
  spotifyPlaylistId: string;
  tracks: readonly RadioTrack[];
}

export function createRadioTrack(
  id: string,
  stationId: RadioStationId,
  index: number,
  title: string,
  artist: string,
  spotifyId: string,
): RadioTrack {
  const q = encodeURIComponent(`${title} ${artist}`);
  return {
    id,
    stationId,
    index,
    title,
    artist,
    spotifyId,
    spotifyUrl: `https://open.spotify.com/track/${spotifyId}`,
    ytMusicUrl: `https://music.youtube.com/search?q=${q}`,
  };
}

// Curated stations of official soundtrack releases on Spotify (10 tracks each). Playback happens in Spotify's own embed; no audio is bundled.
export const RADIO_STATIONS: readonly RadioStation[] = [
  {
    id: 'edgerunners',
    name: 'Edgerunners Radio',
    subtitle: { en: 'Anime Soundtrack · 10 tracks', tr: 'Anime Müzikleri · 10 parça' },
    spotifyPlaylistId: '1XAiAEkhpzxUk6sjby32sh',
    tracks: [
      createRadioTrack('er-01', 'edgerunners', 0, 'I Really Want to Stay at Your House', 'Rosa Walton & Hallie Coggins', '7mykoq6R3BArsSpNDjFQTm'),
      createRadioTrack('er-02', 'edgerunners', 1, 'Let You Down', 'Dawid Podsiadło', '6Efhl5xyn7MsuGhyboRThX'),
      createRadioTrack('er-03', 'edgerunners', 2, 'This Fffire', 'Franz Ferdinand', '6WkBM8cOY4aREMoPDB8gTK'),
      createRadioTrack('er-04', 'edgerunners', 3, "Who's Ready for Tomorrow", 'RAT BOY & IBDY', '4mn5HdatHKN7iFGDes9G8i'),
      createRadioTrack('er-05', 'edgerunners', 4, 'Major Crimes', 'HEALTH & Window Weather', '3nh5RSXnRSHWuQbOJvQr0g'),
      createRadioTrack('er-06', 'edgerunners', 5, 'Friday Night Fire Fight', 'Aligns & Rubicones', '1GhEAuoPdSPiOgqiwLvdf0'),
      createRadioTrack('er-07', 'edgerunners', 6, 'High Forever', 'Petite Meller', '3HO6JuiROufCO6HdEyLdb9'),
      createRadioTrack('er-08', 'edgerunners', 7, 'Watson (feat. Oslo Green)', 'Petite Meller', '2x6cIXV8np81mpKhHXNbDS'),
      createRadioTrack('er-09', 'edgerunners', 8, "You Can't Run From Me", 'Rico Nasty', '098z6VSAmmxyts3ogCGPfr'),
      createRadioTrack('er-10', 'edgerunners', 9, 'A Rusty Dream', 'DOUDOU', '3iidkUl9ZkH8niMALUaxEr'),
    ],
  },
  {
    id: '2077',
    name: '2077 Radio',
    subtitle: { en: 'Night City Favorites · 10 tracks', tr: 'Night City Favorileri · 10 parça' },
    spotifyPlaylistId: '5rn1uqM3yaXf15HBAJEzs4',
    tracks: [
      createRadioTrack('cp-01', '2077', 0, 'Never Fade Away', 'SAMURAI & Refused', '1AslaQYl1cMb1ItQKmtJer'),
      createRadioTrack('cp-02', '2077', 1, "Chippin' In", 'SAMURAI & Refused', '0UHxkkgI5GfV0XBRA1rqfe'),
      createRadioTrack('cp-03', '2077', 2, 'No Save Point', 'Run The Jewels', '0AHn2z0ju96p0subuXWpmF'),
      createRadioTrack('cp-04', '2077', 3, '4ÆM', 'Grimes', '3qKAXiugkeDQPWyXm0fMnt'),
      createRadioTrack('cp-05', '2077', 4, 'The Rebel Path', 'P.T. Adamczyk', '3m8UfZwPMMbiWfGR8Lg2cR'),
      createRadioTrack('cp-06', '2077', 5, 'V', 'Marcin Przybyłowicz', '2u1FWVxAb16qbgwPgygAdj'),
      createRadioTrack('cp-07', '2077', 6, 'Night City', 'R E L & Artemis Delta', '4dK0YKNUAMEV58MZxqN359'),
      createRadioTrack('cp-08', '2077', 7, 'Black Dog', 'SAMURAI', '5Ln8eNkYC9to99zsPEZbS2'),
      createRadioTrack('cp-09', '2077', 8, 'Ponpon Shit', 'Namakopuri & Us Cracks', '2uzsW4vQN4rszPFntOTXPk'),
      createRadioTrack('cp-10', '2077', 9, 'Resist and Disorder', 'Rezodrone & The Cartesian Duelists', '4onvDep8OyHKT85RBO3b4V'),
    ],
  },
];

export const RADIO_TRACKS: readonly RadioTrack[] = RADIO_STATIONS.flatMap((st) => st.tracks);

export function normalizeTrackName(raw: string): string {
  return raw
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/æ/gi, 'ae')
    .replace(/ł/gi, 'l')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^\s*\d{1,2}\s*[-._)]\s*/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function nextTrackIndex(current: number, length: number, delta: 1 | -1): number {
  if (length <= 0) return 0;
  return ((current + delta) % length + length) % length;
}

export function matchFilenameToTrack(filename: string, tracks: readonly RadioTrack[]): RadioTrack | null {
  const clean = normalizeTrackName(filename);
  if (!clean || tracks.length === 0) return null;

  for (const track of tracks) {
    const titleNorm = normalizeTrackName(track.title);
    if (!titleNorm) continue;
    if (clean === titleNorm || (titleNorm.length >= 3 && (clean.includes(titleNorm) || (clean.length >= 4 && titleNorm.includes(clean))))) {
      return track;
    }
  }

  const fileTokens = new Set(clean.split(' ').filter((w) => w.length >= 2 || w === 'v'));
  let best: { track: RadioTrack; score: number } | null = null;

  for (const track of tracks) {
    const titleWords = normalizeTrackName(track.title)
      .split(' ')
      .filter((w) => w.length >= 3 || w === 'v');
    if (titleWords.length === 0) continue;

    let hits = 0;
    for (const w of titleWords) {
      if (fileTokens.has(w)) hits++;
    }
    const artistHit = normalizeTrackName(track.artist)
      .split(' ')
      .some((w) => w.length >= 4 && fileTokens.has(w));
    const ratio = hits / titleWords.length;
    const score = hits * 10 + (artistHit ? 4 : 0);

    if ((ratio >= 0.6 && hits >= 2) || (titleWords.length === 1 && hits === 1 && artistHit)) {
      if (!best || score > best.score) best = { track, score };
    }
  }

  return best ? best.track : null;
}
