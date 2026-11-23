import { useEffect, useRef, useState } from 'preact/hooks';
import {
  AUDIO_ACCEPT_MIME,
  MAX_AUDIO_BYTES,
  RADIO_STATIONS,
  RADIO_TRACKS,
  ambientEngine,
  audioText,
  deleteRadioSlot,
  localPlayer,
  matchFilenameToTrack,
  radioPlayer,
  saveRadioSlot,
  type RadioTrack,
} from '../audio';
import { t } from '../core/i18n';
import type { Locale, Settings } from '../core/schema';
import { safeUrl } from '../core/validate';
import type { Update } from '../state';
import { Icon } from './Icon';

interface Props {
  L: Locale;
  s: Settings;
  update: Update;
  compact?: boolean;
}

function fmtSec(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export function RadioDeck({ L, s, update, compact = false }: Props) {
  const [state, setState] = useState(() => radioPlayer.getState());
  const [statusMsg, setStatusMsg] = useState('');
  const [err, setErr] = useState('');
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const singleInputRef = useRef<HTMLInputElement>(null);
  const targetTrackIdRef = useRef('');
  const playingTrackIdRef = useRef('');
  const advancedForRef = useRef('');

  useEffect(() => radioPlayer.subscribe(() => setState(radioPlayer.getState())), []);

  useEffect(() => {
    playingTrackIdRef.current = '';
    advancedForRef.current = '';
  }, [state.trackId]);

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (ev.origin !== 'https://open.spotify.com') return;
      let msg = ev.data as unknown;
      if (typeof msg === 'string') {
        try {
          msg = JSON.parse(msg);
        } catch {
          return;
        }
      }
      if (!msg || typeof msg !== 'object') return;
      const m = msg as {
        type?: string;
        payload?: { isPaused?: boolean; position?: number; duration?: number };
        isPaused?: boolean;
        position?: number;
        duration?: number;
      };
      if (m.type !== 'playback_update') return;
      const d = m.payload ?? m;
      const isPaused = d.isPaused === true;
      const curState = radioPlayer.getState();
      radioPlayer.setEmbedPlaying(!isPaused);

      const pos = typeof d.position === 'number' ? d.position : 0;
      const dur = typeof d.duration === 'number' ? d.duration : 0;

      if (!isPaused && pos > 2000) {
        playingTrackIdRef.current = curState.trackId;
      }

      if (
        curState.mode === 'track' &&
        curState.source === 'spotify' &&
        playingTrackIdRef.current === curState.trackId &&
        advancedForRef.current !== curState.trackId &&
        dur > 5000 &&
        pos >= dur - 1200
      ) {
        advancedForRef.current = curState.trackId;
        radioPlayer.next(s.audio.ambient.volume);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [s.audio.ambient.volume]);

  if (RADIO_STATIONS.length === 0) return null;

  const volume = s.audio.ambient.volume;
  const pct = Math.round(volume * 100);
  const station = RADIO_STATIONS.find((st) => st.id === state.stationId) ?? RADIO_STATIONS[0]!;
  const currentTrack =
    station.tracks.find((tr) => tr.id === state.trackId) ??
    station.tracks[Math.max(0, Math.min(station.tracks.length - 1, state.trackIndex))] ??
    station.tracks[0];
  const mp3Set = new Set(state.mp3Ids);

  const setSharedVolume = (v: number) => {
    update((d) => {
      d.audio.ambient.volume = v;
    });
    ambientEngine.setVolume(v);
    localPlayer.setVolume(v);
    radioPlayer.setVolume(v);
  };

  const validAudioFile = (file: File) => {
    const okMime =
      AUDIO_ACCEPT_MIME.has(file.type) || /\.(mp3|ogg|wav|m4a|aac|flac|webm)$/i.test(file.name);
    if (!okMime) {
      setErr(audioText(L, 'localErrType'));
      return false;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      setErr(audioText(L, 'localErrSize'));
      return false;
    }
    return true;
  };

  const handleBulkUpload = async (files: FileList | null) => {
    const list = files ? Array.from(files) : [];
    if (bulkInputRef.current) bulkInputRef.current.value = '';
    if (!list.length) return;
    setErr('');
    setStatusMsg('');

    let linked = 0;
    const assigned = new Set(state.mp3Ids);

    for (const file of list) {
      if (!validAudioFile(file)) continue;
      let target: RadioTrack | null = matchFilenameToTrack(file.name, RADIO_TRACKS);
      if (!target) {
        target = station.tracks.find((tr) => !assigned.has(tr.id)) ?? null;
      }
      if (!target) continue;
      try {
        await saveRadioSlot(target.id, file);
        assigned.add(target.id);
        linked++;
      } catch {
        setErr(audioText(L, 'localErrStore'));
      }
    }

    await radioPlayer.refreshSlots();
    if (linked > 0) {
      setStatusMsg(audioText(L, 'radioMatched', { n: linked }));
    }
  };

  const handleSingleAttach = async (files: FileList | null) => {
    const file = files?.[0];
    const trackId = targetTrackIdRef.current;
    if (singleInputRef.current) singleInputRef.current.value = '';
    if (!file || !trackId) return;
    setErr('');
    setStatusMsg('');
    if (!validAudioFile(file)) return;
    try {
      await saveRadioSlot(trackId, file);
      await radioPlayer.refreshSlots();
      setStatusMsg(audioText(L, 'radioMatched', { n: 1 }));
    } catch {
      setErr(audioText(L, 'localErrStore'));
    }
  };

  const clearSlot = async (trackId: string) => {
    setErr('');
    await deleteRadioSlot(trackId);
    await radioPlayer.refreshSlots();
  };

  const displayNum = String((currentTrack?.index ?? state.trackIndex) + 1).padStart(2, '0');

  return (
    <div class={`nd-radio-deck${compact ? ' nd-radio-deck--compact' : ''}`} data-playing={state.playing ? 'true' : 'false'}>
      <div class="nd-radio__stations" role="tablist" aria-label={audioText(L, 'tabRadio')}>
        {RADIO_STATIONS.map((st) => (
          <button
            key={st.id}
            type="button"
            role="tab"
            aria-selected={station.id === st.id}
            class="nd-radio__station-btn"
            onClick={() => radioPlayer.selectStation(st.id, volume)}
          >
            <span>{st.name}</span>
            <span class="nd-radio__num">{st.tracks.length}</span>
          </button>
        ))}
      </div>

      <div class="nd-radio__modes" role="group" aria-label={audioText(L, 'tabRadio')}>
        <button
          type="button"
          class="nd-seg__btn"
          aria-pressed={state.mode === 'track'}
          onClick={() => radioPlayer.setMode('track', volume)}
        >
          {audioText(L, 'radioModeTracks')}
        </button>
        <button
          type="button"
          class="nd-seg__btn"
          aria-pressed={state.mode === 'playlist'}
          onClick={() => radioPlayer.setMode('playlist', volume)}
        >
          {audioText(L, 'radioModePlaylist')}
        </button>
      </div>

      {state.restoredFromSave && !state.playing && currentTrack && (
        <div class="nd-radio__saved">
          <span class="nd-local__now">
            {audioText(L, 'radioLastSaved', { num: displayNum, title: currentTrack.title })}
          </span>
        </div>
      )}

      {state.mode === 'playlist' ? (
        <iframe
          key={`pl-${station.spotifyPlaylistId}-${state.stopEpoch}`}
          class="nd-radio__embed nd-radio__embed--playlist"
          title={station.name}
          src={`https://open.spotify.com/embed/playlist/${station.spotifyPlaylistId}?utm_source=generator&theme=0`}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        />
      ) : (
        <>
          {currentTrack && state.source === 'mp3' ? (
            <div class="nd-radio__now">
              <div class="nd-radio__now-top">
                <span class="nd-amb__eq" aria-hidden="true">
                  <span /><span /><span /><span />
                </span>
                <div class="nd-radio__now-meta">
                  <span class="nd-radio__title">#{displayNum} {currentTrack.title}</span>
                  <span class="nd-radio__artist">{currentTrack.artist}</span>
                </div>
                <span class="nd-radio__badge nd-radio__badge--mp3">
                  {audioText(L, 'radioSourceMp3')}
                </span>
                <div class="nd-local__controls">
                  <button
                    type="button"
                    class="nd-icon-btn nd-icon-btn--sm"
                    aria-label={audioText(L, 'prevTrack')}
                    title={audioText(L, 'prevTrack')}
                    onClick={() => radioPlayer.prev(volume)}
                  >
                    <Icon name="prev" size={13} />
                  </button>
                  <button
                    type="button"
                    class={`nd-icon-btn nd-icon-btn--sm${state.playing ? ' nd-btn--primary' : ''}`}
                    aria-label={audioText(L, state.playing ? 'ambStop' : 'ambPlay')}
                    onClick={() => radioPlayer.togglePlayPause(volume)}
                  >
                    <Icon name={state.playing ? 'pause' : 'play2'} size={13} />
                  </button>
                  <button
                    type="button"
                    class="nd-icon-btn nd-icon-btn--sm"
                    aria-label={audioText(L, 'nextTrack')}
                    title={audioText(L, 'nextTrack')}
                    onClick={() => radioPlayer.next(volume)}
                  >
                    <Icon name="skip" size={13} />
                  </button>
                </div>
              </div>

              <progress
                class="nd-radio__progress"
                value={Math.min(state.elapsedSec, Math.max(1, state.durationSec))}
                max={Math.max(1, state.durationSec)}
              />

              <div class="nd-radio__time-row">
                <span>{station.subtitle[L]}</span>
                <span>{fmtSec(state.elapsedSec)} / {fmtSec(state.durationSec)}</span>
              </div>
            </div>
          ) : (
            currentTrack && (
              <>
                <div class="nd-radio__now">
                  <div class="nd-radio__now-top">
                    <span class="nd-amb__eq" aria-hidden="true">
                      <span /><span /><span /><span />
                    </span>
                    <div class="nd-radio__now-meta">
                      <span class="nd-radio__title">#{displayNum} {currentTrack.title}</span>
                      <span class="nd-radio__artist">{currentTrack.artist}</span>
                    </div>
                    <span class="nd-radio__badge nd-radio__badge--spotify">
                      {audioText(L, 'radioSourceSpotify')}
                    </span>
                    <div class="nd-local__controls">
                      <button
                        type="button"
                        class="nd-icon-btn nd-icon-btn--sm"
                        aria-label={audioText(L, 'prevTrack')}
                        title={audioText(L, 'prevTrack')}
                        onClick={() => radioPlayer.prev(volume)}
                      >
                        <Icon name="prev" size={13} />
                      </button>
                      <button
                        type="button"
                        class="nd-icon-btn nd-icon-btn--sm"
                        aria-label={audioText(L, 'nextTrack')}
                        title={audioText(L, 'nextTrack')}
                        onClick={() => radioPlayer.next(volume)}
                      >
                        <Icon name="skip" size={13} />
                      </button>
                    </div>
                  </div>
                </div>
                <iframe
                  key={`tr-${currentTrack.spotifyId}-${state.stopEpoch}`}
                  class="nd-radio__embed nd-radio__embed--track"
                  title={`${currentTrack.title} - ${currentTrack.artist}`}
                  src={`https://open.spotify.com/embed/track/${currentTrack.spotifyId}?utm_source=generator&theme=0`}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                />
              </>
            )
          )}

          <div class="nd-radio__toolbar">
            <button type="button" class="nd-btn nd-btn--sm" onClick={() => bulkInputRef.current?.click()}>
              <Icon name="upload" size={13} /> {audioText(L, 'radioMatchMp3')}
            </button>
            <input
              ref={bulkInputRef}
              type="file"
              accept="audio/*,.mp3,.ogg,.wav,.m4a,.aac,.flac,.webm"
              multiple
              class="nd-file-input"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => void handleBulkUpload(e.currentTarget.files)}
            />
            <input
              ref={singleInputRef}
              type="file"
              accept="audio/*,.mp3,.ogg,.wav,.m4a,.aac,.flac,.webm"
              class="nd-file-input"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => void handleSingleAttach(e.currentTarget.files)}
            />
          </div>

          {statusMsg && <p class="nd-hint" role="status">{statusMsg}</p>}
          {err && <p class="nd-error" role="alert">{err}</p>}

          <ul class="nd-radio__list">
            {station.tracks.map((tr) => {
              const isActive = state.trackId === tr.id;
              const hasMp3 = mp3Set.has(tr.id);
              const sp = safeUrl(tr.spotifyUrl);
              const yt = safeUrl(tr.ytMusicUrl);
              const num = String(tr.index + 1).padStart(2, '0');
              return (
                <li
                  key={tr.id}
                  class={`nd-radio__row${isActive ? ' nd-radio__row--active' : ''}`}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <button
                    type="button"
                    class="nd-radio__playbtn"
                    onClick={() => {
                      if (isActive && hasMp3 && state.playing) {
                        radioPlayer.togglePlayPause(volume);
                      } else {
                        void radioPlayer.selectTrack(station.id, tr.index, volume, 0);
                      }
                    }}
                  >
                    <Icon name={isActive && state.playing ? 'pause' : 'play2'} size={12} />
                    <span class="nd-radio__num">{num}</span>
                    <div class="nd-radio__meta">
                      <span class="nd-radio__title">{tr.title}</span>
                      <span class="nd-radio__artist">{tr.artist}</span>
                    </div>
                  </button>

                  <span class={`nd-radio__badge${hasMp3 ? ' nd-radio__badge--mp3' : ' nd-radio__badge--spotify'}`}>
                    {audioText(L, hasMp3 ? 'radioSourceMp3' : 'radioSourceSpotify')}
                  </span>

                  <div class="nd-radio__links">
                    {hasMp3 ? (
                      <button
                        type="button"
                        class="nd-radio__mp3btn"
                        aria-label={audioText(L, 'radioClearMp3', { title: tr.title })}
                        title={audioText(L, 'radioClearMp3', { title: tr.title })}
                        onClick={() => void clearSlot(tr.id)}
                      >
                        <Icon name="trash" size={11} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        class="nd-radio__mp3btn"
                        aria-label={audioText(L, 'radioAttachMp3', { title: tr.title })}
                        title={audioText(L, 'radioAttachMp3', { title: tr.title })}
                        onClick={() => {
                          targetTrackIdRef.current = tr.id;
                          singleInputRef.current?.click();
                        }}
                      >
                        <Icon name="upload" size={11} />
                      </button>
                    )}
                    {sp && (
                      <a
                        href={sp}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="nd-radio__link"
                        title={`Spotify: ${tr.title}`}
                      >
                        SP
                      </a>
                    )}
                    {yt && (
                      <a
                        href={yt}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="nd-radio__link nd-radio__link--yt"
                        title={`YouTube Music: ${tr.title}`}
                      >
                        YT
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {mp3Set.size > 0 && (
            <label class="nd-field nd-amb__vol">
              <span class="nd-row">
                <Icon name={pct === 0 ? 'mute' : 'sound'} size={14} />
                <span>{audioText(L, 'ambVolume')}</span>
                <span class="nd-amb__pct">{pct}%</span>
              </span>
              <input
                type="range"
                class="nd-range"
                min={0}
                max={100}
                value={pct}
                aria-label={t(L, 'audio_ambVolume')}
                onInput={(e) => setSharedVolume(Math.max(0, Math.min(1, Number(e.currentTarget.value) / 100)))}
              />
            </label>
          )}
        </>
      )}

      <p class="nd-hint">{audioText(L, 'radioSeqHint')}</p>
    </div>
  );
}
