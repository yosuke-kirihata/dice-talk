import { DICE_PIPS } from '@/shared/dice';
import { loadJsonPreference, saveJsonPreference } from '@/shared/storage/jsonPreferences';
import { HEX_COLOR, isRecord } from '@/shared/validation';
import { DEFAULT_DICE_DESIGN, type FaceColorMap, type FaceTextMap } from './designState';

const CUSTOM_THEMES_KEY = 'dice-talk.customThemes.v1';
const CUSTOM_THEMES_VERSION = 1;
const CUSTOM_THEME_ID_MAX_LENGTH = 80;
const CUSTOM_THEMES_MAX_COUNT = 20;

/** カスタムテーマ名として保存・入力できる最大文字数。 */
export const CUSTOM_THEME_NAME_MAX_LENGTH = 18;

/** 1 つの面テキストとして保存・入力できる最大文字数。 */
export const CUSTOM_THEME_FACE_TEXT_MAX_LENGTH = 40;
type MutableFaceTextMap = Record<(typeof DICE_PIPS)[number], string>;
type MutableFaceColorMap = Record<(typeof DICE_PIPS)[number], string>;

/** 組み込みプリセットとは別に保存する、ユーザー作成のサイコロ面テーマ。 */
export interface CustomTheme {
  readonly id: string;
  readonly name: string;
  readonly faceTexts: FaceTextMap;
  readonly faceColors: FaceColorMap;
}

interface StoredCustomThemes {
  readonly version: typeof CUSTOM_THEMES_VERSION;
  readonly themes: readonly CustomTheme[];
}

const parseFaceTexts = (value: unknown): FaceTextMap | null => {
  if (!isRecord(value)) return null;
  const next: MutableFaceTextMap = { ...DEFAULT_DICE_DESIGN.faceTexts };
  for (const pip of DICE_PIPS) {
    const text = value[String(pip)];
    if (typeof text === 'string') next[pip] = text.slice(0, CUSTOM_THEME_FACE_TEXT_MAX_LENGTH);
  }
  return next;
};

const parseFaceColors = (value: unknown): FaceColorMap | null => {
  if (!isRecord(value)) return null;
  const next: MutableFaceColorMap = { ...DEFAULT_DICE_DESIGN.faceColors };
  for (const pip of DICE_PIPS) {
    const color = value[String(pip)];
    if (typeof color === 'string' && HEX_COLOR.test(color)) next[pip] = color.toLowerCase();
  }
  return next;
};

const parseCustomTheme = (value: unknown): CustomTheme | null => {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== 'string' ||
    value.id.trim() === '' ||
    value.id.length > CUSTOM_THEME_ID_MAX_LENGTH
  ) {
    return null;
  }
  if (typeof value.name !== 'string' || value.name.trim() === '') return null;
  const faceTexts = parseFaceTexts(value.faceTexts);
  const faceColors = parseFaceColors(value.faceColors);
  if (!faceTexts || !faceColors) return null;
  return {
    id: value.id,
    name: value.name.trim().slice(0, CUSTOM_THEME_NAME_MAX_LENGTH),
    faceTexts,
    faceColors,
  };
};

const parseStoredCustomThemes = (raw: string): readonly CustomTheme[] | null => {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || parsed.version !== CUSTOM_THEMES_VERSION) return null;
  if (!Array.isArray(parsed.themes)) return null;
  return parsed.themes.slice(0, CUSTOM_THEMES_MAX_COUNT).flatMap((theme) => {
    const parsedTheme = parseCustomTheme(theme);
    return parsedTheme ? [parsedTheme] : [];
  });
};

/** localStorage から検証済みカスタムテーマ一覧を読み込む。未保存なら null を返す。 */
export const loadCustomThemes = async (): Promise<readonly CustomTheme[] | null> => {
  const value = await loadJsonPreference(CUSTOM_THEMES_KEY);
  if (value === null) return null;
  try {
    return parseStoredCustomThemes(value);
  } catch {
    return null;
  }
};

/** 現在の storage schema version で、カスタムテーマ一覧全体を保存する。 */
export const saveCustomThemes = async (themes: readonly CustomTheme[]): Promise<void> => {
  const payload: StoredCustomThemes = {
    version: CUSTOM_THEMES_VERSION,
    themes,
  };
  await saveJsonPreference(CUSTOM_THEMES_KEY, JSON.stringify(payload));
};
