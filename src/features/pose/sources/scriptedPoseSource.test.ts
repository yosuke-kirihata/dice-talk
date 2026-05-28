import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PoseSnapshot } from '@/shared/pose';
import { ScriptedPoseSource } from './scriptedPoseSource';

const SNAPS: readonly PoseSnapshot[] = [
  { quat: [0, 0, 0, 1], timestamp: 0 },
  { quat: [0, 0.1, 0, 0.995], timestamp: 100 },
  { quat: [0, 0.2, 0, 0.98], timestamp: 200 },
];

describe('ScriptedPoseSource', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('has id "scripted"', () => {
    expect(new ScriptedPoseSource(SNAPS).id).toBe('scripted');
  });

  it('rejects an empty snapshot list at construction', () => {
    expect(() => new ScriptedPoseSource([])).toThrow();
  });

  it('initial getCurrentPose returns the first snapshot', () => {
    const src = new ScriptedPoseSource(SNAPS);
    expect(src.getCurrentPose()).toEqual(SNAPS[0]);
  });

  it('start advances through snapshots over time', async () => {
    const src = new ScriptedPoseSource(SNAPS, { stepMs: 100 });
    await src.start();
    vi.advanceTimersByTime(100);
    expect(src.getCurrentPose()).toEqual(SNAPS[1]);
    vi.advanceTimersByTime(100);
    expect(src.getCurrentPose()).toEqual(SNAPS[2]);
  });

  it('stop halts further advancement', async () => {
    const src = new ScriptedPoseSource(SNAPS, { stepMs: 100 });
    await src.start();
    vi.advanceTimersByTime(100);
    await src.stop();
    vi.advanceTimersByTime(500);
    expect(src.getCurrentPose()).toEqual(SNAPS[1]);
  });

  it('subscribers receive each advanced snapshot', async () => {
    const src = new ScriptedPoseSource(SNAPS, { stepMs: 100 });
    const received: PoseSnapshot[] = [];
    src.subscribe((s) => received.push(s));
    await src.start();
    vi.advanceTimersByTime(200);
    expect(received).toHaveLength(2);
    expect(received[0]).toEqual(SNAPS[1]);
    expect(received[1]).toEqual(SNAPS[2]);
  });

  it('does not loop by default (stays on last snapshot)', async () => {
    const src = new ScriptedPoseSource(SNAPS, { stepMs: 50 });
    await src.start();
    vi.advanceTimersByTime(1000);
    expect(src.getCurrentPose()).toEqual(SNAPS[SNAPS.length - 1]);
  });

  it('loops when { loop: true } is configured', async () => {
    const src = new ScriptedPoseSource(SNAPS, { stepMs: 50, loop: true });
    await src.start();
    vi.advanceTimersByTime(50 * SNAPS.length);
    expect(src.getCurrentPose()).toEqual(SNAPS[0]);
  });
});
