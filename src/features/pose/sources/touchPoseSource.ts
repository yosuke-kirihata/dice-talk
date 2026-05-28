import { fromAxisAngle, identity, multiply, normalize } from '@/features/pose/lib/quaternion';
import type { PoseListener, PoseSnapshot, PoseSource, Quat, Unsubscribe } from '@/shared/pose';
import { nowMs } from '@/shared/time';
import {
  DEFAULT_SPIN_CONFIG,
  type SpinMotionConfig,
  type SpinMotionState,
  startSpinMotion,
  stepSpinMotion,
} from './spinMotion';

const DEFAULT_SENSITIVITY = 0.005;

/** ドラッグ移動量と自動スピンアニメーションで姿勢を更新する PoseSource。 */
export class TouchPoseSource implements PoseSource {
  readonly id = 'touch';
  private quat: Quat = identity();
  private readonly sensitivity: number;
  private readonly listeners = new Set<PoseListener>();
  private spin: SpinMotionState | null = null;
  private spinConfig: SpinMotionConfig = DEFAULT_SPIN_CONFIG;
  private spinRafId: number | null = null;

  constructor(opts?: { sensitivity?: number }) {
    this.sensitivity = opts?.sensitivity ?? DEFAULT_SENSITIVITY;
  }

  /** スピンフレームを強制更新せず、最後に保持している姿勢を返す。 */
  getCurrentPose(): PoseSnapshot {
    return { quat: this.quat, timestamp: nowMs() };
  }

  /** 実行中のスピンを指定時刻まで進め、その時点の姿勢を返す。 */
  advance(now = nowMs()): PoseSnapshot {
    this.updateSpin(now);
    return { quat: this.quat, timestamp: now };
  }

  /** 自動スピン中でなければ、ポインター移動量を姿勢回転として適用する。 */
  applyDelta(dx: number, dy: number): void {
    if (this.spin) return;
    if (dx === 0 && dy === 0) return;
    const yaw = fromAxisAngle([0, 1, 0], dx * this.sensitivity);
    const pitch = fromAxisAngle([1, 0, 0], dy * this.sensitivity);
    this.quat = normalize(multiply(multiply(yaw, pitch), this.quat));
    this.emit();
  }

  /** 自動スピンを開始し、開始時点で選ばれた目標出目を返す。 */
  startSpin(config: SpinMotionConfig = this.spinConfig, now = nowMs(), seed = now): number {
    this.spinConfig = config;
    this.spin = startSpinMotion(this.quat, config, now, seed);
    this.quat = this.spin.quat;
    this.ensureSpinRaf();
    this.emit(now);
    return this.spin.targetPip;
  }

  /** 現在時刻まで進めたうえで、スピンが継続中かどうかを返す。 */
  isSpinning(): boolean {
    this.advance();
    return this.spin !== null;
  }

  /** タッチ操作またはスピンによる姿勢更新を購読する。 */
  subscribe(listener: PoseListener): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** PoseSource 互換性のための lifecycle hook。TouchPoseSource では何もしない。 */
  async start(): Promise<void> {}

  /** 実行中のスピンをキャンセルし、予約済み animation frame を解除する。 */
  async stop(): Promise<void> {
    if (this.spinRafId !== null) {
      cancelAnimationFrame(this.spinRafId);
      this.spinRafId = null;
    }
    this.spin = null;
  }

  private updateSpin(now: number): void {
    if (!this.spin) return;
    const next = stepSpinMotion(this.spin, this.spinConfig, now);
    this.spin = next.done ? null : next.state;
    this.quat = next.state.quat;
  }

  private emit(timestamp = nowMs()): void {
    const snap = { quat: this.quat, timestamp };
    for (const l of this.listeners) l(snap);
  }

  private ensureSpinRaf(): void {
    if (this.spinRafId !== null || typeof requestAnimationFrame !== 'function') return;
    const tick = () => {
      this.spinRafId = null;
      if (!this.spin) return;
      const now = nowMs();
      this.advance(now);
      this.emit(now);
      if (this.spin) this.ensureSpinRaf();
    };
    this.spinRafId = requestAnimationFrame(tick);
  }
}
