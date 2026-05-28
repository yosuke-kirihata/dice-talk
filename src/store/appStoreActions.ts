import type { StateCreator } from 'zustand';
import {
  DEFAULT_DICE_DESIGN,
  applyCustomTheme,
  applyPresetTheme,
  buildMigratedTheme,
  createThemeId,
  customThemeActiveId,
  customThemeFromDesign,
  THEME_NAME_MAX_LENGTH,
  THEME_PRESETS,
} from '@/features/dice';
import { restoreActiveThemeDesign, selectActiveCustomTheme } from './appStoreSelectors';
import type { AppStore, AppStoreActions } from './appStoreTypes';

/** Zustand の set/get を受け取り、アプリ store の更新アクション群を組み立てる。 */
export const createAppStoreActions: StateCreator<AppStore, [], [], AppStoreActions> = (
  set,
  get,
) => ({
  hydrateFaceDesign: (storedCustomThemes, faceTexts, faceColors) => {
    const migratedTheme =
      storedCustomThemes === null ? buildMigratedTheme(faceTexts, faceColors) : null;
    const nextCustomThemes = storedCustomThemes ?? (migratedTheme ? [migratedTheme] : []);
    const firstTheme = nextCustomThemes[0];
    const fallbackTheme = THEME_PRESETS[0];
    set((state) => ({
      customThemes: nextCustomThemes,
      ...(firstTheme
        ? {
            design: applyCustomTheme(state.design, firstTheme),
            activeThemeId: customThemeActiveId(firstTheme.id),
          }
        : {
            design: applyPresetTheme(state.design, fallbackTheme),
            activeThemeId: fallbackTheme.id,
          }),
    }));
  },
  setFaceDesignLoaded: (loaded) => set({ faceDesignLoaded: loaded }),
  setAudioCueConfig: (config) => set({ audioCueConfig: config }),
  setAudioCueLoaded: (loaded) => set({ audioCueLoaded: loaded }),
  setMenuOpen: (open) => set({ menuOpen: open }),
  setUsageOpen: (open) => set({ usageOpen: open }),
  setThemeSelectOpen: (open) => set({ themeSelectOpen: open }),
  setThemeTab: (tab) => set({ themeTab: tab }),
  setThemeEditorOpen: (open) => {
    const state = get();
    if (open || !state.draftCustomTheme) {
      set({ themeEditorOpen: open });
      return;
    }
    set({
      themeEditorOpen: false,
      draftCustomTheme: null,
      design: restoreActiveThemeDesign(state),
    });
  },
  setAppSettingsOpen: (open) => set({ appSettingsOpen: open }),
  setDebugOpen: (open) => set({ debugOpen: open }),
  openAppSettings: () =>
    set({ appSettingsOpen: true, themeEditorOpen: false, debugOpen: false, menuOpen: false }),
  openDesignSettings: () => {
    const activeCustomTheme = selectActiveCustomTheme(get());
    if (!activeCustomTheme) return;
    set((state) => ({
      design: applyCustomTheme(state.design, activeCustomTheme),
      themeEditorOpen: true,
      appSettingsOpen: false,
      debugOpen: false,
      menuOpen: false,
    }));
  },
  openThemeSelect: () => set({ themeSelectOpen: true, menuOpen: false }),
  openUsage: () => set({ usageOpen: true, menuOpen: false }),
  selectTheme: (theme) =>
    set((state) => ({
      activeThemeId: theme.id,
      design: applyPresetTheme(state.design, theme),
      themeSelectOpen: false,
    })),
  selectCustomTheme: (theme) =>
    set((state) => ({
      activeThemeId: customThemeActiveId(theme.id),
      design: applyCustomTheme(state.design, theme),
      themeSelectOpen: false,
    })),
  editCustomTheme: (theme) =>
    set((state) => ({
      activeThemeId: customThemeActiveId(theme.id),
      draftCustomTheme: theme,
      design: applyCustomTheme(state.design, theme),
      themeSelectOpen: false,
      themeEditorOpen: true,
      appSettingsOpen: false,
      debugOpen: false,
    })),
  deleteCustomTheme: (theme) => {
    const state = get();
    const nextThemes = state.customThemes.filter((item) => item.id !== theme.id);
    const deletedActiveTheme = state.activeThemeId === customThemeActiveId(theme.id);
    if (!deletedActiveTheme) {
      set({ customThemes: nextThemes });
      return;
    }

    const nextTheme = nextThemes[0];
    if (nextTheme) {
      set({
        customThemes: nextThemes,
        activeThemeId: customThemeActiveId(nextTheme.id),
        design: applyCustomTheme(state.design, nextTheme),
      });
      return;
    }

    const fallbackTheme = THEME_PRESETS[0];
    set({
      customThemes: nextThemes,
      activeThemeId: fallbackTheme.id,
      design: applyPresetTheme(state.design, fallbackTheme),
      themeEditorOpen: false,
    });
  },
  createCustomTheme: () => {
    const state = get();
    const nextTheme = customThemeFromDesign(
      createThemeId(),
      `マイテーマ ${state.customThemes.length + 1}`,
      DEFAULT_DICE_DESIGN,
    );
    set((current) => ({
      draftCustomTheme: nextTheme,
      design: applyCustomTheme(current.design, nextTheme),
      themeSelectOpen: false,
      themeEditorOpen: true,
      appSettingsOpen: false,
      debugOpen: false,
    }));
  },
  handleDesignChange: (next) => {
    const state = get();
    if (state.draftCustomTheme) {
      set({
        draftCustomTheme: customThemeFromDesign(
          state.draftCustomTheme.id,
          state.draftCustomTheme.name,
          next,
        ),
        design: next,
      });
      return;
    }
    const activeCustomTheme = selectActiveCustomTheme(state);
    if (!activeCustomTheme) return;
    const nextTheme = customThemeFromDesign(activeCustomTheme.id, activeCustomTheme.name, next);
    set({
      customThemes: state.customThemes.map((theme) =>
        theme.id === activeCustomTheme.id ? nextTheme : theme,
      ),
      design: next,
    });
  },
  handleThemeNameChange: (nextName) => {
    const state = get();
    const nextThemeName = nextName.slice(0, THEME_NAME_MAX_LENGTH);
    if (state.draftCustomTheme) {
      set({ draftCustomTheme: { ...state.draftCustomTheme, name: nextThemeName } });
      return;
    }
    const activeCustomTheme = selectActiveCustomTheme(state);
    if (!activeCustomTheme) return;
    set({
      customThemes: state.customThemes.map((theme) =>
        theme.id === activeCustomTheme.id ? { ...theme, name: nextThemeName } : theme,
      ),
    });
  },
  handleAppSettingsChange: (next) => set({ design: next }),
  confirmCustomTheme: () => {
    const state = get();
    const draft = state.draftCustomTheme;
    if (!draft) return;
    const isEdit = state.customThemes.some((theme) => theme.id === draft.id);
    const fallbackIndex = isEdit ? state.customThemes.length : state.customThemes.length + 1;
    const normalizedTheme = {
      ...draft,
      name: draft.name.trim() || `マイテーマ ${fallbackIndex}`,
    };
    set((current) => ({
      customThemes: isEdit
        ? current.customThemes.map((theme) =>
            theme.id === normalizedTheme.id ? normalizedTheme : theme,
          )
        : [...current.customThemes, normalizedTheme],
      activeThemeId: customThemeActiveId(normalizedTheme.id),
      design: applyCustomTheme(current.design, normalizedTheme),
      draftCustomTheme: null,
      themeEditorOpen: false,
    }));
  },
});
