import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScriptedPoseSource } from '@/features/pose/sources/scriptedPoseSource';
import { DebugChartView } from './DebugChartView';

interface FakeChartDef {
  readonly kind: 'quat' | 'euler';
  readonly count: number;
}

interface FakeChartOpts {
  readonly capacity: number;
  readonly windowSec: number;
  readonly width?: number;
  readonly height?: number;
}

const chartMock = vi.hoisted(() => {
  const push = vi.fn();
  const pause = vi.fn();
  const resume = vi.fn();
  const clear = vi.fn();
  const setWindowSec = vi.fn();
  const setSize = vi.fn();
  const destroy = vi.fn();
  const ctor = vi.fn(function fakeChart(
    _target: HTMLElement,
    _def: FakeChartDef,
    _opts: FakeChartOpts,
  ) {
    return { push, pause, resume, clear, setWindowSec, setSize, destroy };
  });
  return { ctor, push, pause, resume, clear, setWindowSec, setSize, destroy };
});

vi.mock('../charting/UPlotTimeSeries', () => ({
  UPlotTimeSeries: chartMock.ctor,
}));

describe('DebugChartView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    // testing-library cleanup happens automatically via setup
  });

  it('does not construct a chart when active=false', () => {
    const src = new ScriptedPoseSource([{ quat: [0, 0, 0, 1], timestamp: 0 }]);
    render(<DebugChartView poseSource={src} active={false} />);
    expect(chartMock.ctor).not.toHaveBeenCalled();
  });

  it('constructs a chart when active=true with the default Quat series', () => {
    const src = new ScriptedPoseSource([{ quat: [0, 0, 0, 1], timestamp: 0 }]);
    render(<DebugChartView poseSource={src} active />);
    expect(chartMock.ctor).toHaveBeenCalledTimes(1);
    const def = chartMock.ctor.mock.calls[0]?.[1];
    const opts = chartMock.ctor.mock.calls[0]?.[2];
    expect(def?.kind).toBe('quat');
    expect(opts?.windowSec).toBe(10);
  });

  it('switching the series tab destroys the old chart and constructs a new one', async () => {
    const user = userEvent.setup();
    const src = new ScriptedPoseSource([{ quat: [0, 0, 0, 1], timestamp: 0 }]);
    render(<DebugChartView poseSource={src} active />);
    expect(chartMock.ctor).toHaveBeenCalledTimes(1);
    expect(chartMock.ctor.mock.calls[0]?.[1]?.kind).toBe('quat');

    await user.click(screen.getByRole('radio', { name: /角度/ }));
    expect(chartMock.destroy).toHaveBeenCalled();
    expect(chartMock.ctor.mock.calls.at(-1)?.[1]?.kind).toBe('euler');
  });

  it('pause button toggles chart.pause / chart.resume', async () => {
    const user = userEvent.setup();
    const src = new ScriptedPoseSource([{ quat: [0, 0, 0, 1], timestamp: 0 }]);
    render(<DebugChartView poseSource={src} active />);

    const pauseBtn = screen.getByRole('button', { name: /一時停止/ });
    await user.click(pauseBtn);
    expect(chartMock.pause).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /再開/ }));
    expect(chartMock.resume).toHaveBeenCalledTimes(1);
  });

  it('clear button calls chart.clear', async () => {
    const user = userEvent.setup();
    const src = new ScriptedPoseSource([{ quat: [0, 0, 0, 1], timestamp: 0 }]);
    render(<DebugChartView poseSource={src} active />);
    await user.click(screen.getByRole('button', { name: /クリア/ }));
    expect(chartMock.clear).toHaveBeenCalledTimes(1);
  });

  it('switching the time window updates the existing chart without recreating it', async () => {
    const user = userEvent.setup();
    const src = new ScriptedPoseSource([{ quat: [0, 0, 0, 1], timestamp: 0 }]);
    render(<DebugChartView poseSource={src} active />);

    await user.click(screen.getByRole('radio', { name: /5秒/ }));
    expect(chartMock.ctor).toHaveBeenCalledTimes(1);
    expect(chartMock.destroy).not.toHaveBeenCalled();
    expect(chartMock.setWindowSec).toHaveBeenCalledWith(5);
  });

  it('does not push incoming samples while paused', async () => {
    const user = userEvent.setup();
    const src = new ScriptedPoseSource([{ quat: [0, 0, 0, 1], timestamp: 0 }]);
    const subscribe = vi.spyOn(src, 'subscribe');
    render(<DebugChartView poseSource={src} active />);

    await user.click(screen.getByRole('button', { name: /一時停止/ }));
    const listener = subscribe.mock.calls[0]?.[0];
    act(() => {
      listener?.({ quat: [0.1, 0.2, 0.3, 0.9], timestamp: Date.now() });
    });

    expect(chartMock.push).not.toHaveBeenCalled();
  });

  it('subscribes to the pose source while active and pushes values to the chart', () => {
    const src = new ScriptedPoseSource([{ quat: [0, 0, 0, 1], timestamp: 0 }]);
    const subscribe = vi.spyOn(src, 'subscribe');
    render(<DebugChartView poseSource={src} active />);
    expect(subscribe).toHaveBeenCalledTimes(1);

    const listener = subscribe.mock.calls[0]?.[0];
    expect(listener).toBeDefined();
    act(() => {
      listener?.({ quat: [0.1, 0.2, 0.3, 0.9], timestamp: 1234 });
    });
    expect(chartMock.push).toHaveBeenCalled();
    const lastCall = chartMock.push.mock.calls.at(-1);
    expect(lastCall?.[0]).toBe(0);
    expect(lastCall?.[1]).toEqual([0.1, 0.2, 0.3, 0.9]);
  });

  it('destroys the chart and unsubscribes on unmount', () => {
    const src = new ScriptedPoseSource([{ quat: [0, 0, 0, 1], timestamp: 0 }]);
    const unsub = vi.fn();
    vi.spyOn(src, 'subscribe').mockImplementation(() => unsub);
    const { unmount } = render(<DebugChartView poseSource={src} active />);
    unmount();
    expect(chartMock.destroy).toHaveBeenCalled();
    expect(unsub).toHaveBeenCalled();
  });
});
