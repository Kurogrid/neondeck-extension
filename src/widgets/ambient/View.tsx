import { useEffect, useRef, useState } from 'preact/hooks';
import {
  AMBIENT_TRACKS,
  AUDIO_ACCEPT_MIME,
  MAX_AUDIO_BYTES,
  RADIO_STATIONS,
  ambientEngine,
  audioText,
  deleteLocalTrack,
  listLocalTracks,
  localPlayer,
  radioPlayer,
  saveLocalTrack,
  type AmbientTrack,
  type LocalTrack,
} from '../../audio';
import { Icon } from '../../components/Icon';
import { RadioDeck } from '../../components/RadioDeck';
import type { Locale, Settings } from '../../core/schema';
import type { Update } from '../../state';

interface Props {
  L: Locale;
  s: Settings;
  update: Update;
}

type AudioTab = 'synth' | 'local' | 'radio';

export function AmbientView({ L, s, update }: Props) {
  const showRadio = RADIO_STATIONS.length > 0;
  const [runtime, setRuntime] = useState(() => ambientEngine.getState());
  const [localState, setLocalState] = useState(() => localPlayer.getState());
  const [radioState, setRadioState] = useState(() => radioPlayer.getState());
  const [localTracks, setLocalTracks] = useState<LocalTrack[]>([]);
  // Start on the local synth tab: the Spotify embed loads only after the user opens the Radio tab (privacy policy).
  const [tab, setTab] = useState<AudioTab>('synth');
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => ambientEngine.subscribe(() => setRuntime(ambientEngine.getState())), []);
  useEffect(() => localPlayer.subscribe(() => setLocalState(localPlayer.getState())), []);
  useEffect(() => radioPlayer.subscribe(() => setRadioState(radioPlayer.getState())), []);
  useEffect(() => {
    let alive = true;
    void listLocalTracks().then((items) => {
      if (!alive) return;
      setLocalTracks(items);
      localPlayer.setPlaylist(items);
    });
    return () => { alive = false; };
  }, []);

  const { track, volume } = s.audio.ambient;
  const activeSynth = runtime.playing && runtime.track === track && track !== 'off';
  const anyPlaying = activeSynth || localState.playing || radioState.playing;
  const pct = Math.round(volume * 100);
  const tabs: readonly AudioTab[] = showRadio ? ['synth', 'local', 'radio'] : ['synth', 'local'];

  const selectTrack = (next: AmbientTrack) => {
    update((d) => {
      d.audio.ambient.track = next;
    });
    if (next === 'off') ambientEngine.stop();
    else ambientEngine.start(next, volume);
  };

  const toggleSynth = () => {
    if (track === 'off') return;
    if (activeSynth) ambientEngine.stop();
    else ambientEngine.start(track, volume);
  };

  const uploadAudioFiles = async (files: FileList | null) => {
    const list = files ? Array.from(files) : [];
    if (fileRef.current) fileRef.current.value = '';
    if (!list.length) return;
    setErr('');
    const added: LocalTrack[] = [];
    for (const file of list) {
      const okMime = AUDIO_ACCEPT_MIME.has(file.type) || /\.(mp3|ogg|wav|m4a|aac|flac|webm)$/i.test(file.name);
      if (!okMime) { setErr(audioText(L, 'localErrType')); continue; }
      if (file.size > MAX_AUDIO_BYTES) { setErr(audioText(L, 'localErrSize')); continue; }
      try {
        added.push(await saveLocalTrack(file));
      } catch {
        setErr(audioText(L, 'localErrStore'));
      }
    }
    if (added.length) {
      setLocalTracks((prev) => {
        const nextList = [...added.reverse(), ...prev];
        localPlayer.setPlaylist(nextList);
        return nextList;
      });
    }
  };

  const removeLocal = async (id: string) => {
    await deleteLocalTrack(id);
    setLocalTracks((prev) => {
      const nextList = prev.filter((x) => x.id !== id);
      localPlayer.setPlaylist(nextList);
      return nextList;
    });
  };

  const setSharedVolume = (v: number) => {
    update((d) => {
      d.audio.ambient.volume = v;
    });
    ambientEngine.setVolume(v);
    localPlayer.setVolume(v);
    radioPlayer.setVolume(v);
  };

  return (
    <div class="nd-amb" data-playing={anyPlaying ? 'true' : 'false'}>
      <div class="nd-amb__tabs" role="tablist" aria-label={audioText(L, 'ambientTrack')}>
        {tabs.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            class="nd-amb__tab"
            onClick={() => setTab(id)}
          >
            {audioText(L, id === 'synth' ? 'tabSynth' : id === 'local' ? 'tabLocal' : 'tabRadio')}
          </button>
        ))}
      </div>

      {tab === 'synth' && (
        <>
          <div class="nd-amb__tracks nd-amb__tracks--grid" role="radiogroup" aria-label={audioText(L, 'ambientTrack')}>
            {AMBIENT_TRACKS.map((tr) => (
              <button
                key={tr}
                type="button"
                role="radio"
                aria-checked={track === tr}
                class="nd-seg__btn"
                onClick={() => selectTrack(tr)}
              >
                {audioText(L, `track_${tr}`)}
              </button>
            ))}
          </div>

          <div class="nd-amb__bar">
            <span class="nd-amb__eq" aria-hidden="true">
              <span /><span /><span /><span />
            </span>
            <span class="nd-amb__status">
              {track === 'off'
                ? audioText(L, 'ambOff')
                : activeSynth
                  ? audioText(L, 'ambPlaying')
                  : audioText(L, 'ambReady')}
            </span>
            {track !== 'off' && (
              <button
                type="button"
                class={`nd-btn nd-btn--sm nd-chamfer${activeSynth ? '' : ' nd-btn--primary'}`}
                onClick={toggleSynth}
              >
                <Icon name={activeSynth ? 'pause' : 'play2'} size={14} />
                {audioText(L, activeSynth ? 'ambStop' : 'ambPlay')}
              </button>
            )}
          </div>
        </>
      )}

      {tab === 'local' && (
        <>
          <div class="nd-local__top">
            <button type="button" class="nd-btn nd-btn--sm" onClick={() => fileRef.current?.click()}>
              <Icon name="upload" size={14} /> {audioText(L, 'localUpload')}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*,.mp3,.ogg,.wav,.m4a,.aac,.flac,.webm"
              multiple
              class="nd-file-input"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => void uploadAudioFiles(e.currentTarget.files)}
            />
          </div>

          {localTracks.length > 0 ? (
            <>
              <div class="nd-amb__bar">
                <span class="nd-amb__eq" aria-hidden="true">
                  <span /><span /><span /><span />
                </span>
                <span class="nd-amb__status nd-local__now">
                  {localState.title || localTracks[0]!.title}
                </span>
                <div class="nd-local__controls">
                  <button
                    type="button"
                    class="nd-icon-btn nd-icon-btn--sm"
                    aria-label={audioText(L, 'prevTrack')}
                    title={audioText(L, 'prevTrack')}
                    onClick={() => localPlayer.prev(volume)}
                  >
                    <Icon name="prev" size={13} />
                  </button>
                  <button
                    type="button"
                    class={`nd-icon-btn nd-icon-btn--sm${localState.playing ? ' nd-btn--primary' : ''}`}
                    aria-label={audioText(L, localState.playing ? 'ambStop' : 'ambPlay')}
                    onClick={() => localPlayer.togglePlayPause(volume)}
                  >
                    <Icon name={localState.playing ? 'pause' : 'play2'} size={13} />
                  </button>
                  <button
                    type="button"
                    class="nd-icon-btn nd-icon-btn--sm"
                    aria-label={audioText(L, 'nextTrack')}
                    title={audioText(L, 'nextTrack')}
                    onClick={() => localPlayer.next(volume)}
                  >
                    <Icon name="skip" size={13} />
                  </button>
                </div>
              </div>

              <ul class="nd-local__list">
                {localTracks.map((item) => {
                  const active = localState.trackId === item.id;
                  return (
                    <li key={item.id} class="nd-local__row">
                      <button
                        type="button"
                        class="nd-local__play"
                        aria-current={active ? 'true' : undefined}
                        onClick={() => localPlayer.playById(item.id, volume)}
                      >
                        <Icon name={active && localState.playing ? 'pause' : 'play2'} size={12} />
                        <span class="nd-local__title">{item.title}</span>
                      </button>
                      <button
                        type="button"
                        class="nd-icon-btn nd-icon-btn--sm nd-icon-btn--danger"
                        aria-label={audioText(L, 'removeTrack')}
                        title={audioText(L, 'removeTrack')}
                        onClick={() => void removeLocal(item.id)}
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p class="nd-hint">{audioText(L, 'localEmpty')}</p>
          )}
          {err && <p class="nd-error" role="alert">{err}</p>}
        </>
      )}

      {tab === 'radio' && showRadio && (
        <RadioDeck L={L} s={s} update={update} compact />
      )}

      {tab !== 'radio' && (
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
            aria-label={audioText(L, 'ambVolume')}
            onInput={(e) => setSharedVolume(Math.max(0, Math.min(1, Number(e.currentTarget.value) / 100)))}
          />
        </label>
      )}

      {tab === 'synth' && <p class="nd-hint">{audioText(L, 'ambNote')}</p>}
    </div>
  );
}
