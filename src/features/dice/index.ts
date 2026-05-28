export type { CustomTheme } from './model/customThemePreferences';
export {
  CUSTOM_THEME_FACE_TEXT_MAX_LENGTH,
  CUSTOM_THEME_NAME_MAX_LENGTH,
  loadCustomThemes,
  saveCustomThemes,
} from './model/customThemePreferences';
export type { DiceDesignState, FaceColorMap, FaceTextMap } from './model/designState';
export {
  DEFAULT_DICE_DESIGN,
  DEFAULT_FACE_COLORS_BY_PIP,
  DEFAULT_FACE_TEXTS,
  faceColorMapToFaceColors,
} from './model/designState';
export type { DicePip } from './model/diceGeometry';
export { DICE_FACE_DEFINITIONS } from './model/diceGeometry';
export { loadFaceColors, saveFaceColors } from './model/faceColorPreferences';
export {
  FACE_ORIENTATIONS,
  FRONT_DIRECTION,
  getFaceOrientationByPip,
} from './model/faceOrientation';
export { loadFaceTexts, saveFaceTexts } from './model/faceTextPreferences';
export {
  applyCustomTheme,
  applyPresetTheme,
  buildMigratedTheme,
  createThemeId,
  CUSTOM_THEME_ID_PREFIX,
  customThemeActiveId,
  customThemeFromDesign,
  getCustomThemeId,
  THEME_NAME_MAX_LENGTH,
  THEME_PRESETS,
} from './model/themeCatalog';
export type { ActiveThemeId, ThemeId, ThemePreset, ThemeTab } from './model/themeCatalog';
export type { DiceCanvasProps } from './ui/DiceCanvas';
export { DiceCanvas } from './ui/DiceCanvas';
