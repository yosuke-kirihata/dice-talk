import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QUAT_SERIES } from '../model/seriesAdapter';
import { UPlotTimeSeries } from './UPlotTimeSeries';

interface FakeUPlotOpts {
  readonly series: readonly unknown[];
  readonly width: number;
  readonly height: number;
}

const mocks = vi.hoisted(() => {
  const setData = vi.fn();
  const setScale = vi.fn();
  const setSize = vi.fn();
  const destroy = vi.fn();
  const uplotCtor = vi.fn(function fakeUPlot(_opts: FakeUPlotOpts) {
    return { setData, setScale, setSize, destroy };
  });
  return { setData, setScale, setSize, destroy, uplotCtor };
});

vi.mock('uplot', () => ({
  default: mocks.uplotCtor,
}));

const { setData, setScale, setSize, destroy, uplotCtor } = mocks;

describe('UPlotTimeSeries', () => {
  let target: HTMLElement;

  const makeChart = (opts: { readonly windowSec?: number } = {}) =>
    new UPlotTimeSeries(target, QUAT_SERIES, {
      capacity: 10,
      windowSec: opts.windowSec ?? 10,
    });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    target = document.createElement('div');
    document.body.appendChild(target);
  });

  afterEach(() => {
    vi.useRealTimers();
    target.remove();
  });

  it('constructs uPlot with the given series count + 1 (timestamp + N series)', () => {
    new UPlotTimeSeries(target, QUAT_SERIES, {
      capacity: 10,
      windowSec: 10,
      width: 320,
      height: 200,
    });
    expect(uplotCtor).toHaveBeenCalledTimes(1);
    const opts = uplotCtor.mock.calls[0]?.[0];
    expect(opts).toBeDefined();
    if (!opts) return;
    expect(opts.series).toHaveLength(QUAT_SERIES.count + 1);
    expect(opts.width).toBe(320);
    expect(opts.height).toBe(200);
    expect(setScale).toHaveBeenCalledWith('x', { min: 0, max: 10 });
  });

  it('push schedules a setData on the next animation frame (rAF coalesce)', () => {
    const chart = makeChart();
    chart.push(1, [0.1, 0.2, 0.3, 0.9]);
    expect(setData).not.toHaveBeenCalled();
    vi.advanceTimersToNextFrame();
    expect(setData).toHaveBeenCalledTimes(1);
  });

  it('multiple pushes within one frame coalesce into a single setData', () => {
    const chart = makeChart();
    chart.push(1, [0.1, 0.2, 0.3, 0.9]);
    chart.push(2, [0.2, 0.3, 0.4, 0.85]);
    chart.push(3, [0.3, 0.4, 0.5, 0.8]);
    vi.advanceTimersToNextFrame();
    expect(setData).toHaveBeenCalledTimes(1);
    const data = setData.mock.calls[0]?.[0];
    expect(data[0]).toHaveLength(3);
  });

  it('keeps x scale fixed to the selected window while the chart is young', () => {
    const chart = makeChart({ windowSec: 10 });
    chart.push(3, [0.1, 0.2, 0.3, 0.9]);
    vi.advanceTimersToNextFrame();
    expect(setScale).toHaveBeenLastCalledWith('x', { min: 0, max: 10 });
  });

  it('slides x scale to the latest sample once elapsed time exceeds the window', () => {
    const chart = makeChart({ windowSec: 5 });
    chart.push(2, [0.1, 0.2, 0.3, 0.9]);
    chart.push(8, [0.2, 0.3, 0.4, 0.85]);
    vi.advanceTimersToNextFrame();
    expect(setScale).toHaveBeenLastCalledWith('x', { min: 3, max: 8 });
    const data = setData.mock.calls[0]?.[0];
    expect(Array.from(data[0])).toEqual([8]);
  });

  it('setWindowSec changes the x scale without clearing existing data', () => {
    const chart = makeChart({ windowSec: 10 });
    chart.push(12, [0.1, 0.2, 0.3, 0.9]);
    vi.advanceTimersToNextFrame();

    chart.setWindowSec(5);
    vi.advanceTimersToNextFrame();
    expect(setScale).toHaveBeenLastCalledWith('x', { min: 7, max: 12 });
    const data = setData.mock.calls.at(-1)?.[0];
    expect(Array.from(data[0])).toEqual([12]);
  });

  it('pause stops emitting setData; resume re-enables', () => {
    const chart = makeChart();
    chart.pause();
    chart.push(1, [0.1, 0.2, 0.3, 0.9]);
    vi.advanceTimersToNextFrame();
    expect(setData).not.toHaveBeenCalled();

    chart.resume();
    chart.push(2, [0.2, 0.3, 0.4, 0.85]);
    vi.advanceTimersToNextFrame();
    expect(setData).toHaveBeenCalledTimes(1);
    const data = setData.mock.calls[0]?.[0];
    expect(Array.from(data[0])).toEqual([2]);
  });

  it('clear empties the buffer and emits an empty setData', () => {
    const chart = makeChart();
    chart.push(1, [0.1, 0.2, 0.3, 0.9]);
    vi.advanceTimersToNextFrame();
    expect(setData).toHaveBeenCalledTimes(1);

    chart.clear();
    vi.advanceTimersToNextFrame();
    expect(setData).toHaveBeenCalledTimes(2);
    const data = setData.mock.calls[1]?.[0];
    expect(data[0]).toHaveLength(0);
  });

  it('setSize forwards to uPlot.setSize', () => {
    const chart = makeChart();
    chart.setSize(640, 400);
    expect(setSize).toHaveBeenCalledWith({ width: 640, height: 400 });
  });

  it('destroy releases uPlot and cancels any pending frame', () => {
    const chart = makeChart();
    chart.push(1, [0.1, 0.2, 0.3, 0.9]);
    chart.destroy();
    vi.advanceTimersToNextFrame();
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(setData).not.toHaveBeenCalled();
  });

  it('destroy is idempotent (safe to call twice)', () => {
    const chart = makeChart();
    chart.destroy();
    chart.destroy();
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it('push / clear / setSize after destroy are no-ops', () => {
    const chart = makeChart();
    chart.destroy();
    chart.push(1, [0, 0, 0, 1]);
    chart.clear();
    chart.setSize(100, 100);
    vi.advanceTimersToNextFrame();
    expect(setData).not.toHaveBeenCalled();
    expect(setSize).not.toHaveBeenCalled();
  });

  it('pausing between push and rAF flush prevents setData', () => {
    const chart = makeChart();
    chart.push(1, [0, 0, 0, 1]);
    chart.pause();
    vi.advanceTimersToNextFrame();
    expect(setData).not.toHaveBeenCalled();
  });

  it('clear after destroy does not call setData', () => {
    const chart = makeChart();
    chart.destroy();
    chart.clear();
    vi.advanceTimersToNextFrame();
    expect(setData).not.toHaveBeenCalled();
  });
});
