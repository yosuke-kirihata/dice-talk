import uPlot from 'uplot';
import { PoseRingBuffer } from '../model/poseRingBuffer';
import type { SeriesDef } from '../model/seriesAdapter';

/** UPlotTimeSeries のバッファ容量、表示幅、描画サイズを指定するオプション。 */
export interface UPlotTimeSeriesOptions {
  readonly capacity: number;
  readonly windowSec: number;
  readonly width?: number;
  readonly height?: number;
}

const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 200;

const buildUPlotOpts = (def: SeriesDef, width: number, height: number): uPlot.Options => ({
  width,
  height,
  pxAlign: 0,
  legend: { show: false },
  cursor: { show: false, x: false, y: false, drag: { x: false, y: false } },
  scales: {
    x: { time: false },
    y: def.kind === 'quat' ? { range: [-1.05, 1.05] } : {},
  },
  axes: [
    {
      stroke: '#4d4d4d',
      grid: { stroke: '#e6e6e6' },
      ticks: { stroke: '#cccccc' },
    },
    {
      stroke: '#4d4d4d',
      grid: { stroke: '#e6e6e6' },
      ticks: { stroke: '#cccccc' },
    },
  ],
  series: [
    {},
    ...def.labels.map((label, i) => ({
      label,
      stroke: def.colors[i] ?? '#fff',
      width: 1.25,
      points: { show: false },
    })),
  ],
});

const ringToAlignedData = (
  buf: PoseRingBuffer,
  seriesCount: number,
  minT: number,
): uPlot.AlignedData => {
  const v = buf.viewSince(minT);
  const ys: Float64Array[] = [];
  for (let i = 0; i < seriesCount; i++) {
    const s = v.series[i];
    if (s) ys.push(s);
  }
  return [v.ts, ...ys] as uPlot.AlignedData;
};

/** PoseRingBuffer と uPlot を接続し、一定時間窓の時系列チャートを描画する。 */
export class UPlotTimeSeries {
  private readonly buffer: PoseRingBuffer;
  private readonly seriesCount: number;
  private chart: uPlot;
  private windowSec: number;
  private latestT = 0;
  private rafHandle: number | null = null;
  private paused = false;
  private destroyed = false;

  constructor(target: HTMLElement, def: SeriesDef, opts: UPlotTimeSeriesOptions) {
    this.seriesCount = def.count;
    this.buffer = new PoseRingBuffer(opts.capacity, def.count);
    this.windowSec = opts.windowSec;
    const width = opts.width ?? DEFAULT_WIDTH;
    const height = opts.height ?? DEFAULT_HEIGHT;
    const initialData: uPlot.AlignedData = [
      new Float64Array(0),
      ...Array.from({ length: def.count }, () => new Float64Array(0)),
    ] as uPlot.AlignedData;
    this.chart = new uPlot(buildUPlotOpts(def, width, height), initialData, target);
    this.applyXScale();
  }

  push(t: number, values: readonly number[]): void {
    if (this.destroyed) return;
    if (this.paused) return;
    this.latestT = Math.max(0, t);
    this.buffer.push(t, values);
    this.scheduleFlush();
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  clear(): void {
    if (this.destroyed) return;
    this.buffer.clear();
    this.latestT = 0;
    this.scheduleFlush({ force: true });
  }

  setWindowSec(windowSec: number): void {
    if (this.destroyed) return;
    this.windowSec = windowSec;
    this.scheduleFlush({ force: true });
  }

  setSize(width: number, height: number): void {
    if (this.destroyed) return;
    this.chart.setSize({ width, height });
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
    this.chart.destroy();
  }

  private scheduleFlush(opts: { force?: boolean } = {}): void {
    if (this.destroyed) return;
    if (!opts.force && this.paused) return;
    if (this.rafHandle !== null) return;
    this.rafHandle = requestAnimationFrame(() => {
      this.rafHandle = null;
      if (this.destroyed) return;
      if (this.paused && !opts.force) return;
      const xMin = Math.max(0, this.latestT - this.windowSec);
      this.chart.setData(ringToAlignedData(this.buffer, this.seriesCount, xMin), true);
      this.applyXScale();
    });
  }

  private applyXScale(): void {
    const xMin = Math.max(0, this.latestT - this.windowSec);
    this.chart.setScale('x', { min: xMin, max: xMin + this.windowSec });
  }
}
