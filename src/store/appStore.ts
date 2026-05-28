import { create } from 'zustand';
import { createAppStoreActions } from './appStoreActions';
import { selectActiveCustomTheme, selectActiveThemeName } from './appStoreSelectors';
import { initialAppStoreState } from './appStoreState';
import type { AppStore } from './appStoreTypes';

export type { AppStore } from './appStoreTypes';
export { selectActiveCustomTheme, selectActiveThemeName };

/** アプリ全体の UI 状態、テーマ状態、動作設定を保持する Zustand store。 */
export const useAppStore = create<AppStore>((...args) => ({
  ...initialAppStoreState,
  ...createAppStoreActions(...args),
}));
