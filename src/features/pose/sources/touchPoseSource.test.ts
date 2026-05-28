import { afterEach, describe, expect, it, vi } from 'vitest';
import { TouchPoseSource } from './touchPoseSource';

describe('TouchPoseSource', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('has id "touch"', () => {
    expect(new TouchPoseSource().id).toBe('touch');
  });

  it('starts at identity pose [0,0,0,1]', () => {
    const src = new TouchPoseSource();
    expect(src.getCurrentPose().quat).toEqual([0, 0, 0, 1]);
  });

  it('applyDelta(0, 0) leaves pose unchanged', () => {
    const src = new TouchPoseSource();
    src.applyDelta(0, 0);
    expect(src.getCurrentPose().quat).toEqual([0, 0, 0, 1]);
  });

  it('applyDelta(non-zero) produces a unit quaternion different from identity', () => {
    const src = new TouchPoseSource();
    src.applyDelta(50, 30);
    const q = src.getCurrentPose().quat;
    expect(q).not.toEqual([0, 0, 0, 1]);
    expect(Math.hypot(...q)).toBeCloseTo(1, 9);
  });

  it('keeps the quaternion normalized after many deltas', () => {
    const src = new TouchPoseSource();
    for (let i = 0; i < 1000; i++) src.applyDelta(3, -2);
    expect(Math.hypot(...src.getCurrentPose().quat)).toBeCloseTo(1, 12);
  });

  it('subscribe receives a notification on each applyDelta', () => {
    const src = new TouchPoseSource();
    const listener = vi.fn();
    src.subscribe(listener);
    src.applyDelta(10, 5);
    src.applyDelta(0, 8);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('unsubscribe stops further notifications', () => {
    const src = new TouchPoseSource();
    const listener = vi.fn();
    const unsub = src.subscribe(listener);
    src.applyDelta(5, 0);
    unsub();
    src.applyDelta(5, 0);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('startSpin returns the selected pip and eventually settles on its target', () => {
    const src = new TouchPoseSource();
    const config = {
      holdMs: 100,
      durationMs: 200,
      settleMs: 100,
      keyframes: [
        { at: 0, speed: 10 },
        { at: 1, speed: 0 },
      ],
      pipWeights: [0, 0, 1, 0, 0, 0],
    } as const;

    vi.useFakeTimers();
    expect(src.startSpin(config, 1000, 123)).toBe(3);
    vi.setSystemTime(4500);
    expect(src.advance().quat).toEqual([0, 0, 0, 1]);
    vi.useRealTimers();
  });

  it('ignores manual deltas while spinning', () => {
    const src = new TouchPoseSource();
    const config = {
      holdMs: 100,
      durationMs: 200,
      settleMs: 100,
      keyframes: [
        { at: 0, speed: 10 },
        { at: 1, speed: 0 },
      ],
      pipWeights: [0, 0, 1, 0, 0, 0],
    } as const;

    vi.useFakeTimers();
    vi.setSystemTime(1000);
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    src.startSpin(config, 1000, 123);
    const before = src.advance().quat;
    src.applyDelta(100, 100);
    expect(src.advance().quat).toEqual(before);
  });

  it('getCurrentPose does not advance an active spin', () => {
    const src = new TouchPoseSource();
    const config = {
      holdMs: 100,
      durationMs: 200,
      settleMs: 100,
      keyframes: [
        { at: 0, speed: 10 },
        { at: 1, speed: 0 },
      ],
      pipWeights: [0, 0, 1, 0, 0, 0],
    } as const;

    src.startSpin(config, 1000, 123);
    const before = src.getCurrentPose().quat;
    vi.useFakeTimers();
    vi.setSystemTime(4500);
    expect(src.getCurrentPose().quat).toEqual(before);
    expect(src.advance().quat).toEqual([0, 0, 0, 1]);
  });

  it('start and stop resolve without throwing (PoseSource contract)', async () => {
    const src = new TouchPoseSource();
    await expect(src.start()).resolves.toBeUndefined();
    await expect(src.stop()).resolves.toBeUndefined();
  });
});
