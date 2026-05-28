import type { PoseListener, PoseSnapshot, PoseSource, Unsubscribe } from '@/shared/pose';

interface ScriptedOptions {
  readonly stepMs?: number;
  readonly loop?: boolean;
}

const DEFAULT_STEP_MS = 16;

/** テスト、デモ、再現性のあるデバッグ用に、固定の姿勢サンプル列を再生する PoseSource。 */
export class ScriptedPoseSource implements PoseSource {
  readonly id = 'scripted';
  private readonly snapshots: readonly PoseSnapshot[];
  private readonly stepMs: number;
  private readonly loop: boolean;
  private readonly listeners = new Set<PoseListener>();
  private index = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(snapshots: readonly PoseSnapshot[], opts: ScriptedOptions = {}) {
    if (snapshots.length === 0) {
      throw new Error('ScriptedPoseSource requires at least one snapshot');
    }
    this.snapshots = snapshots;
    this.stepMs = opts.stepMs ?? DEFAULT_STEP_MS;
    this.loop = opts.loop ?? false;
  }

  /** 再生位置を進めず、現在選択されている姿勢サンプルを返す。 */
  getCurrentPose(): PoseSnapshot {
    const snap = this.snapshots[this.index];
    if (!snap) throw new Error('ScriptedPoseSource: snapshot index out of range');
    return snap;
  }

  /** 指定された姿勢サンプル列を timer ベースで再生開始する。 */
  async start(): Promise<void> {
    if (this.timer !== null) return;
    this.timer = setInterval(() => {
      const next = this.index + 1;
      if (next < this.snapshots.length) {
        this.index = next;
      } else if (this.loop) {
        this.index = 0;
      } else {
        return;
      }
      const snap = this.snapshots[this.index];
      if (snap) for (const l of this.listeners) l(snap);
    }, this.stepMs);
  }

  /** 以降に再生される姿勢サンプルを購読する。 */
  subscribe(listener: PoseListener): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** 再生を停止する。現在のサンプル位置は維持する。 */
  async stop(): Promise<void> {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
