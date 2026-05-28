/** Three.js と同じ x, y, z, w 順のクォータニオン。 */
export type Quat = readonly [number, number, number, number];

/** 姿勢サンプルと、そのサンプルが生成された時刻 ms。 */
export interface PoseSnapshot {
  readonly quat: Quat;
  readonly timestamp: number;
}

/** PoseSource が新しい姿勢を通知するときに呼ばれる購読コールバック。 */
export type PoseListener = (snap: PoseSnapshot) => void;

/** 登録済み listener を解除する関数。実装によっては複数回呼び出しても安全に扱われる。 */
export type Unsubscribe = () => void;

/** ライブ入力、スクリプト入力、デバッグ入力を同じ形で扱うための姿勢入力インターフェース。 */
export interface PoseSource {
  readonly id: string;
  getCurrentPose(): PoseSnapshot;
  subscribe(listener: PoseListener): Unsubscribe;
  start(): Promise<void>;
  stop(): Promise<void>;
}
