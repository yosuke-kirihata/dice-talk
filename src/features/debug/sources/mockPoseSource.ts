import { normalize } from '@/features/pose';
import type { PoseListener, PoseSnapshot, PoseSource, Quat, Unsubscribe } from '@/shared/pose';
import { nowMs } from '@/shared/time';

/** MockPoseSource が生成するクォータニオン波形を調整するオプション。 */
export interface MockPoseSourceOptions {
  readonly stepMs?: number;
  readonly amplitude?: number;
  readonly frequencies?: readonly [number, number, number, number];
}

const DEFAULT_STEP_MS = 50;
const DEFAULT_AMPLITUDE = 0.6;
const DEFAULT_FREQ: readonly [number, number, number, number] = [0.5, 0.7, 1.1, 1.3];

const sineQuat = (
  tSec: number,
  amp: number,
  freq: readonly [number, number, number, number],
): Quat =>
  normalize([
    amp * Math.sin(2 * Math.PI * freq[0] * tSec),
    amp * Math.sin(2 * Math.PI * freq[1] * tSec + Math.PI / 3),
    amp * Math.sin(2 * Math.PI * freq[2] * tSec + (2 * Math.PI) / 3),
    1 + amp * 0.4 * Math.sin(2 * Math.PI * freq[3] * tSec),
  ]);

/** デバッグチャートや mock シーン開発に使う、合成姿勢を生成する PoseSource。 */
export class MockPoseSource implements PoseSource {
  readonly id = 'mock';
  private readonly stepMs: number;
  private readonly amplitude: number;
  private readonly freq: readonly [number, number, number, number];
  private readonly listeners = new Set<PoseListener>();
  private quat: Quat;
  private timer: ReturnType<typeof setInterval> | null = null;
  private elapsedMs = 0;

  constructor(opts: MockPoseSourceOptions = {}) {
    this.stepMs = opts.stepMs ?? DEFAULT_STEP_MS;
    this.amplitude = opts.amplitude ?? DEFAULT_AMPLITUDE;
    this.freq = opts.frequencies ?? DEFAULT_FREQ;
    this.quat = sineQuat(0, this.amplitude, this.freq);
  }

  /** 最後に生成した姿勢を返す。 */
  getCurrentPose(): PoseSnapshot {
    return { quat: this.quat, timestamp: nowMs() };
  }

  /** 生成された姿勢を購読する listener を登録する。 */
  subscribe(listener: PoseListener): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** 設定された間隔で合成姿勢の通知を開始する。 */
  async start(): Promise<void> {
    if (this.timer !== null) return;
    this.timer = setInterval(() => {
      this.elapsedMs += this.stepMs;
      this.quat = sineQuat(this.elapsedMs / 1000, this.amplitude, this.freq);
      const snap: PoseSnapshot = { quat: this.quat, timestamp: nowMs() };
      for (const l of this.listeners) l(snap);
    }, this.stepMs);
  }

  /** 合成姿勢の通知を停止する。 */
  async stop(): Promise<void> {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
