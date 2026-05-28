/** サイコロ結果に合わせて鳴らす任意の効果音キュー設定。 */
export interface AudioCueConfig {
  readonly sourceId: string | null;
  readonly startSec: number;
  readonly endSec: number;
  readonly volume: number;
  readonly enabled: boolean;
}

/** 初回起動時と不正な保存値のフォールバックに使う、無効状態の効果音設定。 */
export const DEFAULT_AUDIO_CUE_CONFIG: AudioCueConfig = {
  sourceId: null,
  startSec: 0,
  endSec: 0,
  volume: 0.8,
  enabled: false,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const finiteOr = (value: number, fallback: number): number =>
  Number.isFinite(value) ? value : fallback;

/** 選択音源と有効状態を保ったまま、再生範囲と音量を有効な値へ正規化する。 */
export const validateAudioCueConfig = (cfg: AudioCueConfig): AudioCueConfig => {
  const startSec = Math.max(0, finiteOr(cfg.startSec, DEFAULT_AUDIO_CUE_CONFIG.startSec));
  const requestedEndSec = finiteOr(cfg.endSec, DEFAULT_AUDIO_CUE_CONFIG.endSec);
  const endSec = requestedEndSec >= startSec ? requestedEndSec : startSec + 0.1;
  return {
    sourceId: cfg.sourceId,
    startSec,
    endSec,
    volume: clamp(finiteOr(cfg.volume, DEFAULT_AUDIO_CUE_CONFIG.volume), 0, 1),
    enabled: cfg.enabled,
  };
};
