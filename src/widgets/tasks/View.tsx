import { useState } from 'preact/hooks';
import { Icon } from '../../components/Icon';
import { t } from '../../core/i18n';
import { useMinute } from '../../hooks';
import type { WidgetProps } from '../types';
import { MAX_HABITS, MAX_TASKS, dayKey, lastDays, newHabit, newTask, streak, toggleHabitDay } from './logic';

function AddRow({ placeholder, label, onAdd, disabled }: { placeholder: string; label: string; onAdd: (v: string) => void; disabled?: boolean }) {
  const [v, setV] = useState('');
  return (
    <form class="nd-row" onSubmit={(e) => { e.preventDefault(); if (v.trim()) { onAdd(v); setV(''); } }}>
      <label class="nd-field nd-grow">
        <span class="nd-sr">{placeholder}</span>
        <input value={v} placeholder={placeholder} maxLength={200} disabled={disabled} onInput={(e) => setV(e.currentTarget.value)} />
      </label>
      <button type="submit" class="nd-btn nd-btn--sm" disabled={disabled || !v.trim()}>{label}</button>
    </form>
  );
}

export function TasksView({ L, config, setConfig, editing }: WidgetProps<'tasks'>) {
  const now = useMinute();
  const today = dayKey(now);
  const doneCount = config.tasks.filter((x) => x.done).length;
  const weekday = (day: string) => new Intl.DateTimeFormat(L, { weekday: 'narrow' }).format(new Date(`${day}T12:00:00`));

  return (
    <div class="nd-tk">
      <section class="nd-tk__sec">
        <div class="nd-tk__head">
          <h4 class="nd-tk__title">{t(L, 'tkTasks')}</h4>
          {editing && doneCount > 0 && (
            <button type="button" class="nd-btn nd-btn--sm nd-btn--ghost" onClick={() => setConfig({ ...config, tasks: config.tasks.filter((x) => !x.done) })}>{t(L, 'tkClearDone')}</button>
          )}
        </div>
        {editing && <AddRow placeholder={t(L, 'tkTaskPlaceholder')} label={t(L, 'tkAdd')} disabled={config.tasks.length >= MAX_TASKS}
          onAdd={(v) => setConfig({ ...config, tasks: [...config.tasks, newTask(v)] })} />}
        {config.tasks.length ? (
          <ul class="nd-tk__list">
            {config.tasks.map((task) => (
              <li key={task.id} class={`nd-tk__item ${task.done ? 'is-done' : ''}`}>
                <label class="nd-check nd-grow">
                  <input type="checkbox" checked={task.done}
                    onChange={() => setConfig({ ...config, tasks: config.tasks.map((x) => (x.id === task.id ? { ...x, done: !x.done } : x)) })} />
                  <span>{task.text}</span>
                </label>
                {editing && <button type="button" class="nd-icon-btn nd-icon-btn--sm nd-icon-btn--danger" aria-label={t(L, 'tkDelete', { name: task.text })} title={t(L, 'tkDelete', { name: task.text })}
                  onClick={() => setConfig({ ...config, tasks: config.tasks.filter((x) => x.id !== task.id) })}><Icon name="close" /></button>}
              </li>
            ))}
          </ul>
        ) : <p class="nd-hint">{t(L, editing ? 'tkEmptyTasks' : 'widgetEditHint')}</p>}
      </section>

      <section class="nd-tk__sec">
        <h4 class="nd-tk__title">{t(L, 'tkHabits')}</h4>
        {editing && <AddRow placeholder={t(L, 'tkHabitPlaceholder')} label={t(L, 'tkAdd')} disabled={config.habits.length >= MAX_HABITS}
          onAdd={(v) => setConfig({ ...config, habits: [...config.habits, newHabit(v)] })} />}
        {config.habits.length ? (
          <ul class="nd-tk__list">
            {config.habits.map((h) => {
              const n = streak(h.days, now);
              return (
                <li key={h.id} class="nd-hb">
                  <div class="nd-hb__top">
                    <label class="nd-check nd-grow">
                      <input type="checkbox" checked={h.days.includes(today)} aria-label={t(L, 'tkDoneToday', { name: h.name })}
                        onChange={() => setConfig({ ...config, habits: config.habits.map((x) => (x.id === h.id ? toggleHabitDay(x, today) : x)) })} />
                      <span>{h.name}</span>
                    </label>
                    <span class={`nd-badge ${n > 0 ? 'nd-badge--on' : ''}`}>{t(L, 'tkStreak', { n })}</span>
                    {editing && <button type="button" class="nd-icon-btn nd-icon-btn--sm nd-icon-btn--danger" aria-label={t(L, 'tkDelete', { name: h.name })} title={t(L, 'tkDelete', { name: h.name })}
                      onClick={() => setConfig({ ...config, habits: config.habits.filter((x) => x.id !== h.id) })}><Icon name="close" /></button>}
                  </div>
                  <ol class="nd-hb__days" aria-hidden="true">
                    {lastDays(h, now).map((d) => <li key={d.day} class={d.done ? 'is-done' : ''} title={d.day}>{weekday(d.day)}</li>)}
                  </ol>
                </li>
              );
            })}
          </ul>
        ) : <p class="nd-hint">{t(L, editing ? 'tkEmptyHabits' : 'widgetEditHint')}</p>}
      </section>
    </div>
  );
}
