import { useEffect, useState } from 'preact/hooks';
import { ambientEngine, audioText, type AmbientTrack } from '../../audio';
import { Icon } from '../../components/Icon';
import type { Locale, Settings } from '../../core/schema';
import type { Update } from '../../state';

interface Props {
  L: Locale;
  s: Settings;
  update: Update;
}

const TRACKS: readonly AmbientTrack[] = ['off', 'rain', 'synthwave'];

export function AmbientView({ L, s, update }: Props) {
  const [runtime, setRuntime] = useState(() => ambientEngine.getState());
  useEffect(() => ambientEngine.subscribe(() => setRuntime(ambientEngine.getState())), []);

  const { track, volume } = s.audio.ambient;
  const activePlaying = runtime.playing && runtime.track === track && track !== 'off';
  const pct = Math.round(volume * 100);

  const selectTrack = (next: AmbientTrack) => {
    update((d) => {
      d.audio.ambient.track = next;
    });
    if (next === 'off') ambientEngine.stop();
    else ambientEngine.start(next, volume);
  };

  const togglePlay = () => {
    if (track === 'off') return;
    if (activePlaying) ambientEngine.stop();
    else ambientEngine.start(track, volume);
  };

  return (
    <div class="nd-amb" data-playing={activePlaying ? 'true' : 'false'}>
      <div class="nd-amb__tracks" role="radiogroup" aria-label={audioText(L, 'ambientTrack')}>
        {TRACKS.map((tr) => (
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
          <span />
          <span />
          <span />
          <span />
        </span>
        <span class="nd-amb__status">
          {track === 'off'
            ? audioText(L, 'ambOff')
            : activePlaying
              ? audioText(L, 'ambPlaying')
              : audioText(L, 'ambReady')}
        </span>
        {track !== 'off' && (
          <button
            type="button"
            class={`nd-btn nd-btn--sm nd-chamfer${activePlaying ? '' : ' nd-btn--primary'}`}
            onClick={togglePlay}
          >
            <Icon name={activePlaying ? 'pause' : 'play2'} size={14} />
            {audioText(L, activePlaying ? 'ambStop' : 'ambPlay')}
          </button>
        )}
      </div>

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
          onInput={(e) => {
            const v = Math.max(0, Math.min(1, Number(e.currentTarget.value) / 100));
            update((d) => {
              d.audio.ambient.volume = v;
            });
            ambientEngine.setVolume(v);
          }}
        />
      </label>

      <p class="nd-hint">{audioText(L, 'ambNote')}</p>
    </div>
  );
}
