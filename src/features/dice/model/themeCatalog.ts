import {
  CUSTOM_THEME_NAME_MAX_LENGTH,
  type CustomTheme,
} from './customThemePreferences';
import {
  DEFAULT_DICE_DESIGN,
  DEFAULT_FACE_TEXTS,
  type DiceDesignState,
  type FaceColorMap,
  type FaceTextMap,
} from './designState';

/** カスタムテーマを activeThemeId に入れるときに付与する prefix。 */
export const CUSTOM_THEME_ID_PREFIX = 'custom:';

/** UI で扱うテーマ名の最大文字数。 */
export const THEME_NAME_MAX_LENGTH = CUSTOM_THEME_NAME_MAX_LENGTH;

/** 組み込みプリセットテーマを識別する ID。 */
export type ThemeId = 'default' | 'party' | 'intro' | 'family' | 'school' | 'workshop';

/** UI が扱う有効テーマ ID。カスタムテーマはプリセットとの衝突を避けるため prefix を付ける。 */
export type ActiveThemeId = ThemeId | `custom:${string}`;

/** テーマ選択ダイアログのタブ ID。 */
export type ThemeTab = 'my' | 'preset';

/** 組み込みのサイコロ面テーマと、テーマカード表示用の swatch class。 */
export interface ThemePreset {
  readonly id: ThemeId;
  readonly name: string;
  readonly faceTexts: FaceTextMap;
  readonly faceColors: FaceColorMap;
  readonly swatchClass: string;
}

/** プリセットタブに表示する組み込みサイコロ面テーマ一覧。 */
export const THEME_PRESETS = [
  {
    id: 'default',
    name: 'デフォルトテーマ',
    faceTexts: DEFAULT_FACE_TEXTS,
    faceColors: {
      1: '#ffffff',
      2: '#fb7185',
      3: '#60a5fa',
      4: '#facc15',
      5: '#5eead4',
      6: '#a78bfa',
    },
    swatchClass: 'theme-card__dice--default',
  },
  {
    id: 'party',
    name: '飲み会トーク',
    faceTexts: {
      1: '最近笑ったことは？',
      2: '乾杯したい出来事は？',
      3: '忘れられない旅行は？',
      4: '好きなおつまみは？',
      5: '今日の気分を一言で',
      6: '次に行きたいお店は？',
    },
    faceColors: {
      1: '#ffffff',
      2: '#7dd3fc',
      3: '#86efac',
      4: '#bef264',
      5: '#fde68a',
      6: '#c4b5fd',
    },
    swatchClass: 'theme-card__dice--party',
  },
  {
    id: 'intro',
    name: '自己紹介',
    faceTexts: {
      1: '名前の由来は？',
      2: '好きな食べ物は？',
      3: '休日の過ごし方は？',
      4: '得意なことは？',
      5: '最近始めたことは？',
      6: 'みんなに聞きたいことは？',
    },
    faceColors: {
      1: '#ffffff',
      2: '#c4b5fd',
      3: '#7dd3fc',
      4: '#f0abfc',
      5: '#a7f3d0',
      6: '#fde68a',
    },
    swatchClass: 'theme-card__dice--intro',
  },
  {
    id: 'family',
    name: '家族でトーク',
    faceTexts: {
      1: '今日よかったことは？',
      2: '週末にしたいことは？',
      3: '好きなごはんは？',
      4: '手伝ってほしいことは？',
      5: '最近がんばったことは？',
      6: '家族にありがとうを伝えるなら？',
    },
    faceColors: {
      1: '#ffffff',
      2: '#fdba74',
      3: '#facc15',
      4: '#fb7185',
      5: '#86efac',
      6: '#93c5fd',
    },
    swatchClass: 'theme-card__dice--family',
  },
  {
    id: 'school',
    name: '学校・クラス',
    faceTexts: {
      1: '今日学んだことは？',
      2: '好きな教科は？',
      3: '休み時間の楽しみは？',
      4: '友だちのいいところは？',
      5: '挑戦してみたいことは？',
      6: 'クラスでやってみたいことは？',
    },
    faceColors: {
      1: '#ffffff',
      2: '#6ee7b7',
      3: '#a3e635',
      4: '#fef08a',
      5: '#93c5fd',
      6: '#c4b5fd',
    },
    swatchClass: 'theme-card__dice--school',
  },
  {
    id: 'workshop',
    name: 'ワークショップ',
    faceTexts: {
      1: '今日の発見は？',
      2: '試してみたいアイデアは？',
      3: '困っていることは？',
      4: '誰かに聞きたいことは？',
      5: '次に小さく進めるなら？',
      6: 'みんなで決めたいことは？',
    },
    faceColors: {
      1: '#ffffff',
      2: '#38bdf8',
      3: '#34d399',
      4: '#fbbf24',
      5: '#fb7185',
      6: '#818cf8',
    },
    swatchClass: 'theme-card__dice--workshop',
  },
] satisfies readonly [ThemePreset, ...ThemePreset[]];

/** 保存用カスタムテーマ ID を、selector が扱う activeThemeId 形式へ変換する。 */
export const customThemeActiveId = (id: string): ActiveThemeId => `${CUSTOM_THEME_ID_PREFIX}${id}`;

/** activeThemeId から保存用カスタムテーマ ID を取り出す。プリセットの場合は null を返す。 */
export const getCustomThemeId = (activeId: ActiveThemeId): string | null =>
  activeId.startsWith(CUSTOM_THEME_ID_PREFIX)
    ? activeId.slice(CUSTOM_THEME_ID_PREFIX.length)
    : null;

/** デザイン設定のうち面テキストと面色だけを、再利用可能なカスタムテーマとして切り出す。 */
export const customThemeFromDesign = (
  id: string,
  name: string,
  design: DiceDesignState,
): CustomTheme => ({
  id,
  name,
  faceTexts: { ...design.faceTexts },
  faceColors: { ...design.faceColors },
});

/** モーションやデバッグ表示などの非テーマ設定を保ったまま、カスタムテーマを適用する。 */
export const applyCustomTheme = <T extends DiceDesignState>(current: T, theme: CustomTheme): T => ({
  ...current,
  faceTexts: { ...theme.faceTexts },
  faceColors: { ...theme.faceColors },
});

/** モーションやデバッグ表示などの非テーマ設定を保ったまま、プリセットテーマを適用する。 */
export const applyPresetTheme = <T extends DiceDesignState>(current: T, theme: ThemePreset): T => ({
  ...current,
  faceTexts: { ...theme.faceTexts },
  faceColors: { ...theme.faceColors },
});

/** 新しく保存するカスタムテーマ用の storage ID を生成する。 */
export const createThemeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `theme-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

/** 旧形式で保存されていた面テキスト / 面色設定を、カスタムテーマ形式へ移行する。 */
export const buildMigratedTheme = (
  faceTexts: FaceTextMap | null,
  faceColors: FaceColorMap | null,
): CustomTheme | null => {
  if (!faceTexts && !faceColors) return null;
  return customThemeFromDesign('my-theme-1', 'マイテーマ 1', {
    ...DEFAULT_DICE_DESIGN,
    ...(faceTexts && { faceTexts }),
    ...(faceColors && { faceColors }),
  });
};
