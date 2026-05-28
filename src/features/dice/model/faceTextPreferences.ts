import { DICE_PIPS } from '@/shared/dice';
import { loadJsonPreference, saveJsonPreference } from '@/shared/storage/jsonPreferences';
import { isRecord } from '@/shared/validation';
import { DEFAULT_FACE_TEXTS, type FaceTextMap } from './designState';

const FACE_TEXTS_KEY = 'dice-talk.faceTexts.v1';
const FACE_TEXTS_VERSION = 1;
type MutableFaceTextMap = Record<(typeof DICE_PIPS)[number], string>;

interface StoredFaceTexts {
  readonly version: typeof FACE_TEXTS_VERSION;
  readonly faceTexts: Partial<Record<string, string | undefined>>;
}

const parseStoredFaceTexts = (raw: string): FaceTextMap | null => {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || parsed.version !== FACE_TEXTS_VERSION) return null;
  if (!isRecord(parsed.faceTexts)) return null;

  const next: MutableFaceTextMap = { ...DEFAULT_FACE_TEXTS };
  for (const pip of DICE_PIPS) {
    const text = parsed.faceTexts[String(pip)];
    if (typeof text === 'string') next[pip] = text;
  }
  return next;
};

/** 旧形式の面テキスト preference を読み込む。保存値がない、または不正な場合は null を返す。 */
export const loadFaceTexts = async (): Promise<FaceTextMap | null> => {
  const value = await loadJsonPreference(FACE_TEXTS_KEY);
  if (value === null) return null;
  try {
    return parseStoredFaceTexts(value);
  } catch {
    return null;
  }
};

/** 旧形式の面テキスト preference を保存する。新しいカスタムテーマ移行後も互換用途で残す。 */
export const saveFaceTexts = async (faceTexts: FaceTextMap): Promise<void> => {
  const payload: StoredFaceTexts = {
    version: FACE_TEXTS_VERSION,
    faceTexts,
  };
  await saveJsonPreference(FACE_TEXTS_KEY, JSON.stringify(payload));
};
