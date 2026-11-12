import type { Locale, Settings, WidgetType } from '../core/schema';
import type { WidgetConfigs } from './configs';

/** Props every widget view receives. `setConfig` persists through the settings store. */
export interface WidgetProps<T extends WidgetType> {
  L: Locale;
  s: Settings;
  config: WidgetConfigs[T];
  setConfig: (next: WidgetConfigs[T]) => void;
  /** True while the panel's edit mode is on: show configuration controls only then. */
  editing: boolean;
}
