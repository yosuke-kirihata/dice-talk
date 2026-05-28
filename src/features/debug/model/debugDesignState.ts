import type { DiceDesignState } from '@/features/dice';
import type { SpinMotionConfig } from '@/features/pose';

/** デバッグ設定 UI が編集する、サイコロ見た目・スピン・補助表示の合成設定。 */
export type DebugDesignState = DiceDesignState & {
  readonly spin: SpinMotionConfig;
  readonly showWorldAxes: boolean;
  readonly showLocalAxes: boolean;
  readonly showUpArrow: boolean;
};
