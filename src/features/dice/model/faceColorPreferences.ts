import { DICE_PIPS } from '@/shared/dice';
import { loadJsonPreference, saveJsonPreference } from '@/shared/storage/jsonPreferences';
import { HEX_COLOR, isRecord } from '@/shared/validation';
import { DEFAULT_FACE_COLORS_BY_PIP, type FaceColorMap } from './designState';

const FACE_COLORS_KEY = 'dice-talk.faceColors.v1';
const FACE_COLORS_VERSION = 1;
type MutableFaceColorMap = Record<(typeof DICE_PIPS)[number], string>;

interface StoredFaceColors {
  readonly version: typeof FACE_COLORS_VERSION;
  readonly faceColors: Partial<Record<string, string | undefined>>;
}

const parseStoredFaceColors = (raw: string): FaceColorMap | null => {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || parsed.version !== FACE_COLORS_VERSION) return null;
  if (!isRecord(parsed.faceColors)) return null;

  const next: MutableFaceColorMap = { ...DEFAULT_FACE_COLORS_BY_PIP };
  for (const pip of DICE_PIPS) {
    const color = parsed.faceColors[String(pip)];
    if (typeof color === 'string' && HEX_COLOR.test(color)) next[pip] = color;
  }
  return next;
};

/** 旧形式の面色 preference を読み込む。保存値がない、または不正な場合は null を返す。 */
export const loadFaceColors = async (): Promise<FaceColorMap | null> => {
  const value = await loadJsonPreference(FACE_COLORS_KEY);
  if (value === null) return null;
  try {
    return parseStoredFaceColors(value);
  } catch {
    return null;
  }
};

/** 旧形式の面色 preference を保存する。新しいカスタムテーマ移行後も互換用途で残す。 */
export const saveFaceColors = async (faceColors: FaceColorMap): Promise<void> => {
  const payload: StoredFaceColors = {
    version: FACE_COLORS_VERSION,
    faceColors,
  };
  await saveJsonPreference(FACE_COLORS_KEY, JSON.stringify(payload));
};
