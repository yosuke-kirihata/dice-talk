/** バッファ内の時刻と数値系列を時系列順に並べた読み取り用ビュー。 */
export interface PoseRingBufferView {
  readonly ts: Float64Array;
  readonly series: readonly Float64Array[];
}

/** デバッグチャートのサンプルを固定容量で保持するリングバッファ。 */
export class PoseRingBuffer {
  readonly capacity: number;
  readonly seriesCount: number;
  private readonly tsBuf: Float64Array;
  private readonly seriesBuf: Float64Array[];
  private head = 0;
  private count = 0;

  constructor(capacity: number, seriesCount: number) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error(`PoseRingBuffer: capacity must be a positive integer, got ${capacity}`);
    }
    if (!Number.isInteger(seriesCount) || seriesCount <= 0) {
      throw new Error(`PoseRingBuffer: seriesCount must be a positive integer, got ${seriesCount}`);
    }
    this.capacity = capacity;
    this.seriesCount = seriesCount;
    this.tsBuf = new Float64Array(capacity);
    this.seriesBuf = Array.from({ length: seriesCount }, () => new Float64Array(capacity));
  }

  /** 現在保持しているサンプル数。 */
  get size(): number {
    return this.count;
  }

  /** 1 つの時刻と、設定済み系列数ぶんの値を追加する。 */
  push(t: number, values: readonly number[]): void {
    if (values.length !== this.seriesCount) {
      throw new Error(
        `PoseRingBuffer.push: expected ${this.seriesCount} values, got ${values.length}`,
      );
    }
    this.tsBuf[this.head] = t;
    for (let i = 0; i < this.seriesCount; i++) {
      const buf = this.seriesBuf[i];
      const v = values[i];
      if (buf && v !== undefined) buf[this.head] = v;
    }
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) this.count += 1;
  }

  /** 配列を再確保せず、保持中サンプルだけを空にする。 */
  clear(): void {
    this.head = 0;
    this.count = 0;
  }

  /** すべての保持サンプルを時系列順のコピーとして返す。 */
  view(): PoseRingBufferView {
    const n = this.count;
    const ts = new Float64Array(n);
    const series = this.seriesBuf.map(() => new Float64Array(n));
    if (n === 0) return { ts, series };

    const start = n < this.capacity ? 0 : this.head;
    for (let i = 0; i < n; i++) {
      const src = (start + i) % this.capacity;
      ts[i] = this.tsBuf[src] ?? 0;
      for (let s = 0; s < this.seriesCount; s++) {
        const dst = series[s];
        const buf = this.seriesBuf[s];
        if (dst && buf) dst[i] = buf[src] ?? 0;
      }
    }
    return { ts, series };
  }

  /** minT 以降のサンプルだけを、時系列順のコピーとして返す。 */
  viewSince(minT: number): PoseRingBufferView {
    const all = this.view();
    let start = 0;
    while (start < all.ts.length && (all.ts[start] ?? 0) < minT) start += 1;
    if (start === 0) return all;

    return {
      ts: all.ts.slice(start),
      series: all.series.map((s) => s.slice(start)),
    };
  }
}
