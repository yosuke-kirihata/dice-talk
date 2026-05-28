import { loadJsonPreference, saveJsonPreference } from '@/shared/storage/jsonPreferences';
import { isRecord } from '@/shared/validation';
import {
  type AudioCueConfig,
  DEFAULT_AUDIO_CUE_CONFIG,
  validateAudioCueConfig,
} from './audioCueConfig';

const AUDIO_CUE_CONFIG_KEY = 'audio.cue.config.v1';
const AUDIO_CUE_CONFIG_VERSION = 1;

interface StoredAudioCueConfig {
  readonly version: typeof AUDIO_CUE_CONFIG_VERSION;
  readonly config: AudioCueConfig;
}

const parseConfig = (value: unknown): AudioCueConfig | null => {
  if (!isRecord(value)) return null;
  const sourceId = value.sourceId;
  if (sourceId !== null && typeof sourceId !== 'string') return null;
  if (typeof value.startSec !== 'number') return null;
  if (typeof value.endSec !== 'number') return null;
  if (typeof value.volume !== 'number') return null;
  if (typeof value.enabled !== 'boolean') return null;
  return validateAudioCueConfig({
    sourceId,
    startSec: value.startSec,
    endSec: value.endSec,
    volume: value.volume,
    enabled: value.enabled,
  });
};

const parseStoredConfig = (raw: string): AudioCueConfig | null => {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || parsed.version !== AUDIO_CUE_CONFIG_VERSION) return null;
  return parseConfig(parsed.config);
};

/** 保存済みの効果音設定を読み込み、現在の schema と値域に合うよう検証する。 */
export const loadAudioCueConfig = async (): Promise<AudioCueConfig | null> => {
  const value = await loadJsonPreference(AUDIO_CUE_CONFIG_KEY);
  if (value === null) return null;
  try {
    return parseStoredConfig(value);
  } catch {
    return null;
  }
};

/** 既定値とマージして検証した効果音設定を保存する。 */
export const saveAudioCueConfig = async (config: AudioCueConfig): Promise<void> => {
  const payload: StoredAudioCueConfig = {
    version: AUDIO_CUE_CONFIG_VERSION,
    config: validateAudioCueConfig({ ...DEFAULT_AUDIO_CUE_CONFIG, ...config }),
  };
  await saveJsonPreference(AUDIO_CUE_CONFIG_KEY, JSON.stringify(payload));
};
