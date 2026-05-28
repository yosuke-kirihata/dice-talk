import {
  applyCustomTheme,
  applyPresetTheme,
  type CustomTheme,
  getCustomThemeId,
  THEME_PRESETS,
} from '@/features/dice';
import type { AppDesignState } from '@/types/appDesignState';
import type { AppStoreState } from './appStoreTypes';

/** 現在選択中のカスタムテーマを返す。プリセット選択中は undefined。 */
export const selectActiveCustomTheme = (state: AppStoreState): CustomTheme | undefined => {
  const activeCustomThemeId = getCustomThemeId(state.activeThemeId);
  if (!activeCustomThemeId) return undefined;
  return state.customThemes.find((theme) => theme.id === activeCustomThemeId);
};

/** 現在選択中のテーマ名を返す。見つからない場合は先頭プリセット名へフォールバックする。 */
export const selectActiveThemeName = (state: AppStoreState): string => {
  const activeCustomTheme = selectActiveCustomTheme(state);
  if (activeCustomTheme) return activeCustomTheme.name;
  const activePreset = THEME_PRESETS.find((theme) => theme.id === state.activeThemeId);
  return (activePreset ?? THEME_PRESETS[0]).name;
};

/** 編集キャンセル時などに、現在の activeThemeId に対応する見た目へ design を戻す。 */
export const restoreActiveThemeDesign = (state: AppStoreState): AppDesignState => {
  const customThemeId = getCustomThemeId(state.activeThemeId);
  const customTheme = state.customThemes.find((theme) => theme.id === customThemeId);
  if (customTheme) return applyCustomTheme(state.design, customTheme);
  const presetTheme = THEME_PRESETS.find((theme) => theme.id === state.activeThemeId);
  return applyPresetTheme(state.design, presetTheme ?? THEME_PRESETS[0]);
};
