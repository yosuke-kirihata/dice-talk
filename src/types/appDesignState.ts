import { DEFAULT_DICE_DESIGN, type DiceDesignState } from '@/features/dice';
import { DEFAULT_SPIN_CONFIG, type SpinMotionConfig } from '@/features/pose';

/** シーン上に表示するデバッグ補助要素の ON/OFF 設定。 */
export interface SceneDebugSettings {
  readonly showWorldAxes: boolean;
  readonly showLocalAxes: boolean;
  readonly showUpArrow: boolean;
}

/** アプリ全体で編集・保持する、サイコロ見た目、モーション、デバッグ表示の合成設定。 */
export type AppDesignState = DiceDesignState &
  SceneDebugSettings & {
    readonly spin: SpinMotionConfig;
  };

/** 初回起動、リセット、保存値欠落時に使うアプリ全体のデザイン基準値。 */
export const DEFAULT_APP_DESIGN: AppDesignState = {
  ...DEFAULT_DICE_DESIGN,
  spin: DEFAULT_SPIN_CONFIG,
  showWorldAxes: false,
  showLocalAxes: false,
  showUpArrow: false,
};
