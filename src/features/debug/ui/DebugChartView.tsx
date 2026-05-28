import 'uplot/dist/uPlot.min.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PoseSource } from '@/shared/pose';
import { nowMs } from '@/shared/time';
import { Segmented, type SegmentedItem } from '@/components/ui/Segmented';
import { UPlotTimeSeries } from '../charting/UPlotTimeSeries';
import { getSeriesDef, SERIES_KINDS, type SeriesKind } from '../model/seriesAdapter';

const SAMPLES_PER_SEC = 50;
const MAX_WINDOW_SEC = 30;
const CHART_HEIGHT = 220;
const DEFAULT_WINDOW_SEC = 10;

type WindowOption = '5' | '10' | '30';
const WINDOW_ITEMS: readonly SegmentedItem<WindowOption>[] = [
  { id: '5', label: '5秒' },
  { id: '10', label: '10秒' },
  { id: '30', label: '30秒' },
];

const SERIES_ITEMS: readonly SegmentedItem<SeriesKind>[] = SERIES_KINDS.map((k) => ({
  id: k,
  label: k === 'quat' ? '姿勢' : '角度',
}));

/** ライブ姿勢デバッグチャートの props。 */
export interface DebugChartViewProps {
  readonly poseSource: PoseSource;
  readonly active: boolean;
  readonly className?: string;
}

/** PoseSource から受け取った姿勢を、クォータニオン成分またはオイラー角として uPlot に描画する。 */
export const DebugChartView = ({
  poseSource,
  active,
  className,
}: DebugChartViewProps): React.JSX.Element => {
  const [kind, setKind] = useState<SeriesKind>('quat');
  const [paused, setPaused] = useState(false);
  const [windowSec, setWindowSec] = useState<number>(DEFAULT_WINDOW_SEC);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<UPlotTimeSeries | null>(null);
  const startMsRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const pausedAtMsRef = useRef<number | null>(null);
  const pausedTotalMsRef = useRef(0);
  const windowSecRef = useRef(windowSec);
  windowSecRef.current = windowSec;

  const def = useMemo(() => getSeriesDef(kind), [kind]);
  const capacity = SAMPLES_PER_SEC * MAX_WINDOW_SEC;

  const resetClock = useCallback((): void => {
    startMsRef.current = null;
    pausedAtMsRef.current = pausedRef.current ? nowMs() : null;
    pausedTotalMsRef.current = 0;
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    const target = containerRef.current;
    if (!target) return undefined;
    const width = target.clientWidth || 320;
    const chart = new UPlotTimeSeries(target, def, {
      capacity,
      windowSec: windowSecRef.current,
      width,
      height: CHART_HEIGHT,
    });
    chartRef.current = chart;
    resetClock();
    if (pausedRef.current) chart.pause();
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, [active, def, capacity, resetClock]);

  const togglePaused = (): void => {
    setPaused((v) => {
      const next = !v;
      pausedRef.current = next;
      if (next) {
        pausedAtMsRef.current = nowMs();
        chartRef.current?.pause();
      } else {
        const pausedAt = pausedAtMsRef.current;
        if (pausedAt !== null) pausedTotalMsRef.current += nowMs() - pausedAt;
        pausedAtMsRef.current = null;
        chartRef.current?.resume();
      }
      return next;
    });
  };

  const clearChart = (): void => {
    resetClock();
    chartRef.current?.clear();
  };

  useEffect(() => {
    chartRef.current?.setWindowSec(windowSec);
  }, [windowSec]);

  useEffect(() => {
    if (!active) return undefined;
    const unsub = poseSource.subscribe((snap) => {
      if (pausedRef.current) return;
      if (startMsRef.current === null) startMsRef.current = snap.timestamp;
      const tSec = (snap.timestamp - startMsRef.current - pausedTotalMsRef.current) / 1000;
      chartRef.current?.push(tSec, def.toValues(snap));
    });
    return unsub;
  }, [active, poseSource, def]);

  if (!active) return <div className={className} aria-hidden />;

  const root = ['flex flex-col gap-3 text-[#1a1a1a]', className].filter(Boolean).join(' ');

  return (
    <div className={root}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Segmented
          items={SERIES_ITEMS}
          value={kind}
          onChange={setKind}
          size="sm"
          ariaLabel="表示データ"
        />

        <Segmented
          items={WINDOW_ITEMS}
          value={String(windowSec) as WindowOption}
          onChange={(id) => setWindowSec(Number(id))}
          size="sm"
          ariaLabel="表示時間"
        />

        <div className="inline-flex gap-1">
          <button
            type="button"
            onClick={togglePaused}
            className="px-3 min-h-[44px] text-sm rounded-md border border-[#7c3aed] bg-white text-[#7c3aed] hover:bg-[#f3edff] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd43d]"
          >
            {paused ? '再開' : '一時停止'}
          </button>
          <button
            type="button"
            onClick={clearChart}
            className="px-3 min-h-[44px] text-sm rounded-md border border-[#7c3aed] bg-white text-[#7c3aed] hover:bg-[#f3edff] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd43d]"
          >
            クリア
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="rounded-md border border-[#ddd6fe] bg-white overflow-hidden"
        style={{ height: CHART_HEIGHT, touchAction: 'pan-y' }}
        data-testid="debug-chart-canvas"
      />

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[#4d4d4d] font-mono">
        {def.labels.map((label, i) => (
          <span key={label} className="inline-flex items-center gap-1">
            <span
              aria-hidden
              className="inline-block w-2 h-2 rounded-sm"
              style={{ backgroundColor: def.colors[i] ?? '#fff' }}
            />
            {label}
          </span>
        ))}
        <span className="ml-auto">{def.yLabel}</span>
      </div>
    </div>
  );
};
