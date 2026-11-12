import type { WidgetType } from '../core/schema';
import { cleanAiLinksConfig, type AiLinksConfig } from './ailinks/logic';
import { cleanPomodoroConfig, type PomodoroConfig } from './pomodoro/logic';
import { cleanScratchpadConfig, type ScratchpadConfig } from './scratchpad/logic';
import { cleanTasksConfig, type TasksConfig } from './tasks/logic';
import { cleanWeatherConfig, type WeatherConfig } from './weather/logic';
import { cleanWorldClockConfig, type WorldClockConfig } from './worldclock/logic';

export interface WidgetConfigs {
  weather: WeatherConfig; worldclock: WorldClockConfig; scratchpad: ScratchpadConfig; tasks: TasksConfig;
  pomodoro: PomodoroConfig; ambient: Record<string, never>; ailinks: AiLinksConfig;
}

/** Type-checks a widget's config (untrusted: storage, imports). Missing/invalid values get defaults. */
export function cleanWidgetConfig<T extends WidgetType>(type: T, raw: unknown): WidgetConfigs[T] {
  const cleaners: { [K in WidgetType]: (v: unknown) => WidgetConfigs[K] } = {
    weather: cleanWeatherConfig, worldclock: cleanWorldClockConfig, scratchpad: cleanScratchpadConfig, tasks: cleanTasksConfig,
    pomodoro: cleanPomodoroConfig, ambient: () => ({}), ailinks: cleanAiLinksConfig,
  };
  return cleaners[type](raw);
}
