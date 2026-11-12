import type { ComponentType } from 'preact';
import { useState } from 'preact/hooks';
import { t } from '../core/i18n';
import type { Settings, WidgetState, WidgetType } from '../core/schema';
import type { Update } from '../state';
import { AiLinksView } from '../widgets/ailinks/View';
import { cleanWidgetConfig, type WidgetConfigs } from '../widgets/configs';
import { moveWidget, moveWidgetBy } from '../widgets/order';
import { PomodoroView } from '../widgets/pomodoro/View';
import { ScratchpadView } from '../widgets/scratchpad/View';
import { TasksView } from '../widgets/tasks/View';
import type { WidgetProps } from '../widgets/types';
import { WeatherView } from '../widgets/weather/View';
import { WorldClockView } from '../widgets/worldclock/View';
import { Icon } from './Icon';

const AmbientView = ({ L }: WidgetProps<'ambient'>) => <p class="nd-hint">{t(L, 'ambientSoon')}</p>;

const VIEWS: { [K in WidgetType]: ComponentType<WidgetProps<K>> } = {
  weather: WeatherView, worldclock: WorldClockView, scratchpad: ScratchpadView, tasks: TasksView,
  pomodoro: PomodoroView, ambient: AmbientView, ailinks: AiLinksView,
};
const ICONS: Record<WidgetType, string> = { weather: 'cloud', worldclock: 'clock', scratchpad: 'note', tasks: 'list', pomodoro: 'reset', ambient: 'sound', ailinks: 'chip' };

/** Drag & drop state shared by the cards and the manager list (edit mode only). */
interface Dnd { dragId: string | null; overId: string | null; start: (id: string, e: DragEvent, ghost?: Element | null) => void; over: (id: string, e: DragEvent) => void; drop: (id: string, e: DragEvent) => void; end: () => void }

function useDnd(update: Update): Dnd {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  return {
    dragId, overId,
    start: (id, e, ghost) => {
      if (!e.dataTransfer) return;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
      if (ghost) e.dataTransfer.setDragImage(ghost, 16, 16);
      setDragId(id);
    },
    over: (id, e) => { if (!dragId) return; e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; if (overId !== id) setOverId(id); },
    drop: (id, e) => {
      e.preventDefault();
      const from = dragId ?? e.dataTransfer?.getData('text/plain');
      if (from && from !== id) update((d) => { d.widgets = moveWidget(d.widgets, from, id); });
      setDragId(null); setOverId(null);
    },
    end: () => { setDragId(null); setOverId(null); },
  };
}

const dndClass = (dnd: Dnd, id: string) => `${dnd.dragId === id ? ' is-dragging' : ''}${dnd.overId === id && dnd.dragId !== id ? ' is-drop-target' : ''}`;

function Grip({ L, name, onDragStart, onDragEnd }: { L: Settings['profile']['locale']; name: string; onDragStart: (e: DragEvent & { currentTarget: HTMLSpanElement }) => void; onDragEnd: () => void }) {
  return (
    <span class="nd-grip" draggable title={t(L, 'dragWidget', { name })} aria-hidden="true" onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <Icon name="grip" />
    </span>
  );
}

function WidgetCard<T extends WidgetType>({ s, w, update, editing, dnd }: { s: Settings; w: WidgetState & { type: T }; update: Update; editing: boolean; dnd: Dnd }) {
  const L = s.profile.locale;
  const View = VIEWS[w.type] as ComponentType<WidgetProps<T>>;
  const config = cleanWidgetConfig(w.type, w.config);
  const setConfig = (next: WidgetConfigs[T]) => update((d) => { const x = d.widgets.find((y) => y.id === w.id); if (x) x.config = next; });
  const titleId = `nd-w-${w.id}`;
  const name = t(L, `w_${w.type}`);
  return (
    <section class={`nd-widget nd-widget--${w.type} nd-chamfer${editing ? dndClass(dnd, w.id) : ''}`} aria-labelledby={titleId}
      onDragOver={editing ? (e) => dnd.over(w.id, e) : undefined} onDrop={editing ? (e) => dnd.drop(w.id, e) : undefined}>
      <h3 id={titleId} class="nd-widget__title">
        {editing && <Grip L={L} name={name} onDragStart={(e) => dnd.start(w.id, e, e.currentTarget.closest('.nd-widget'))} onDragEnd={dnd.end} />}
        <Icon name={ICONS[w.type]} /> {name}
        {editing && (
          <span class="nd-widget__move">
            <button type="button" class="nd-icon-btn nd-icon-btn--sm" aria-label={t(L, 'moveUp', { name })} title={t(L, 'moveUp', { name })}
              onClick={() => update((d) => { d.widgets = moveWidgetBy(d.widgets, w.id, -1, (x) => x.enabled); })}><Icon name="up" /></button>
            <button type="button" class="nd-icon-btn nd-icon-btn--sm" aria-label={t(L, 'moveDown', { name })} title={t(L, 'moveDown', { name })}
              onClick={() => update((d) => { d.widgets = moveWidgetBy(d.widgets, w.id, 1, (x) => x.enabled); })}><Icon name="down" /></button>
          </span>
        )}
      </h3>
      <View L={L} s={s} config={config} setConfig={setConfig} editing={editing} />
    </section>
  );
}

function Manager({ s, update, dnd }: { s: Settings; update: Update; dnd: Dnd }) {
  const L = s.profile.locale;
  const list = [...s.widgets].sort((a, b) => a.order - b.order);
  return (
    <ul class="nd-wm">
      {list.map((w, i) => {
        const name = t(L, `w_${w.type}`);
        return (
          <li key={w.id} class={`nd-wm__row${dndClass(dnd, w.id)}`} onDragOver={(e) => dnd.over(w.id, e)} onDrop={(e) => dnd.drop(w.id, e)}>
            <Grip L={L} name={name} onDragStart={(e) => dnd.start(w.id, e, e.currentTarget.closest('.nd-wm__row'))} onDragEnd={dnd.end} />
            <label class="nd-check nd-grow">
              <input type="checkbox" checked={w.enabled} aria-label={t(L, 'enableWidget', { name })}
                onChange={() => update((d) => { const x = d.widgets.find((y) => y.id === w.id); if (x) x.enabled = !x.enabled; })} />
              <Icon name={ICONS[w.type]} /> <span>{name}</span>
            </label>
            <button type="button" class="nd-icon-btn nd-icon-btn--sm" disabled={i === 0} aria-label={t(L, 'moveUp', { name })} title={t(L, 'moveUp', { name })} onClick={() => update((d) => { d.widgets = moveWidgetBy(d.widgets, w.id, -1); })}><Icon name="up" /></button>
            <button type="button" class="nd-icon-btn nd-icon-btn--sm" disabled={i === list.length - 1} aria-label={t(L, 'moveDown', { name })} title={t(L, 'moveDown', { name })} onClick={() => update((d) => { d.widgets = moveWidgetBy(d.widgets, w.id, 1); })}><Icon name="down" /></button>
          </li>
        );
      })}
    </ul>
  );
}

/** Right-hand widget column (SPEC §13). Not modal: global shortcuts keep working outside its inputs. */
export function WidgetPanel({ s, update }: { s: Settings; update: Update }) {
  const L = s.profile.locale;
  const [managing, setManaging] = useState(false);
  const dnd = useDnd(update);
  const enabled = [...s.widgets].filter((w) => w.enabled).sort((a, b) => a.order - b.order);
  return (
    <aside class={`nd-widgets${managing ? ' is-editing' : ''}`} aria-label={t(L, 'widgets')}>
      <div class="nd-section-head">
        <h2 class="nd-section-title">{t(L, 'widgets')}</h2>
        <button type="button" class="nd-icon-btn" aria-pressed={managing} aria-label={t(L, 'manageWidgets')} title={t(L, 'manageWidgets')} onClick={() => setManaging(!managing)}>
          <Icon name={managing ? 'check' : 'edit'} />
        </button>
      </div>
      {managing && <p class="nd-hint">{t(L, 'dragHint')}</p>}
      {managing && <Manager s={s} update={update} dnd={dnd} />}
      {enabled.length
        ? enabled.map((w) => <WidgetCard key={w.id} s={s} w={w} update={update} editing={managing} dnd={dnd} />)
        : !managing && <p class="nd-empty">{t(L, 'widgetsEmpty')}</p>}
    </aside>
  );
}
