import { DEFAULT_AUDIO_CUE_CONFIG } from '@/features/audio';
import { DEFAULT_APP_DESIGN } from '@/types/appDesignState';
import type { AppStoreState } from './appStoreTypes';

/** store 作成時とテストリセットで使う、アプリ状態の初期値。 */
export const initialAppStoreState: AppStoreState = {
  design: DEFAULT_APP_DESIGN,
  customThemes: [],
  faceDesignLoaded: false,
  audioCueConfig: DEFAULT_AUDIO_CUE_CONFIG,
  audioCueLoaded: false,
  themeEditorOpen: false,
  draftCustomTheme: null,
  appSettingsOpen: false,
  debugOpen: false,
  menuOpen: false,
  usageOpen: false,
  themeSelectOpen: false,
  themeTab: 'my',
  activeThemeId: 'default',
};
