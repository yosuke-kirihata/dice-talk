import type { AudioCueConfig } from '@/features/audio';
import type { ActiveThemeId, CustomTheme, FaceColorMap, FaceTextMap, ThemePreset, ThemeTab } from '@/features/dice';
import type { AppDesignState } from '@/types/appDesignState';

/** アプリ store が保持する状態値。 */
export interface AppStoreState {
  readonly design: AppDesignState;
  readonly customThemes: readonly CustomTheme[];
  readonly faceDesignLoaded: boolean;
  readonly audioCueConfig: AudioCueConfig;
  readonly audioCueLoaded: boolean;
  readonly themeEditorOpen: boolean;
  readonly draftCustomTheme: CustomTheme | null;
  readonly appSettingsOpen: boolean;
  readonly debugOpen: boolean;
  readonly menuOpen: boolean;
  readonly usageOpen: boolean;
  readonly themeSelectOpen: boolean;
  readonly themeTab: ThemeTab;
  readonly activeThemeId: ActiveThemeId;
}

/** アプリ store が提供する状態更新アクション。 */
export interface AppStoreActions {
  hydrateFaceDesign: (
    customThemes: readonly CustomTheme[] | null,
    faceTexts: FaceTextMap | null,
    faceColors: FaceColorMap | null,
  ) => void;
  setFaceDesignLoaded: (loaded: boolean) => void;
  setAudioCueConfig: (config: AudioCueConfig) => void;
  setAudioCueLoaded: (loaded: boolean) => void;
  setMenuOpen: (open: boolean) => void;
  setUsageOpen: (open: boolean) => void;
  setThemeSelectOpen: (open: boolean) => void;
  setThemeTab: (tab: ThemeTab) => void;
  setThemeEditorOpen: (open: boolean) => void;
  setAppSettingsOpen: (open: boolean) => void;
  setDebugOpen: (open: boolean) => void;
  openAppSettings: () => void;
  openDesignSettings: () => void;
  openThemeSelect: () => void;
  openUsage: () => void;
  selectTheme: (theme: ThemePreset) => void;
  selectCustomTheme: (theme: CustomTheme) => void;
  editCustomTheme: (theme: CustomTheme) => void;
  deleteCustomTheme: (theme: CustomTheme) => void;
  createCustomTheme: () => void;
  handleDesignChange: (next: AppDesignState) => void;
  handleThemeNameChange: (nextName: string) => void;
  handleAppSettingsChange: (next: AppDesignState) => void;
  confirmCustomTheme: () => void;
}

/** アプリ store の状態とアクションを合わせた公開型。 */
export type AppStore = AppStoreState & AppStoreActions;
