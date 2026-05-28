import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PoseSnapshot } from '@/shared/pose';
import { MockPoseSource } from './mockPoseSource';

const norm = (q: PoseSnapshot['quat']): number => Math.hypot(q[0], q[1], q[2], q[3]);

describe('MockPoseSource', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('has id "mock"', () => {
    expect(new MockPoseSource().id).toBe('mock');
  });

  it('initial getCurrentPose is identity-equivalent (norm ≈ 1)', () => {
    const src = new MockPoseSource();
    expect(norm(src.getCurrentPose().quat)).toBeCloseTo(1, 6);
  });

  it('start emits snapshots over time, stop halts emissions', async () => {
    const src = new MockPoseSource({ stepMs: 20 });
    const seen: PoseSnapshot[] = [];
    src.subscribe((s) => seen.push(s));

    await src.start();
    vi.advanceTimersByTime(60);
    expect(seen.length).toBeGreaterThanOrEqual(2);

    await src.stop();
    const stoppedAt = seen.length;
    vi.advanceTimersByTime(200);
    expect(seen.length).toBe(stoppedAt);
  });

  it('emitted quaternions remain normalized (norm ≈ 1)', async () => {
    const src = new MockPoseSource({ stepMs: 20 });
    const seen: PoseSnapshot[] = [];
    src.subscribe((s) => seen.push(s));
    await src.start();
    vi.advanceTimersByTime(200);
    await src.stop();
    expect(seen.length).toBeGreaterThan(0);
    for (const s of seen) expect(norm(s.quat)).toBeCloseTo(1, 6);
  });

  it('snapshots vary over time (not constant)', async () => {
    const src = new MockPoseSource({ stepMs: 20 });
    await src.start();
    vi.advanceTimersByTime(20);
    const a = src.getCurrentPose().quat;
    vi.advanceTimersByTime(200);
    const b = src.getCurrentPose().quat;
    await src.stop();
    expect(a).not.toEqual(b);
  });

  it('unsubscribe stops further notifications', async () => {
    const src = new MockPoseSource({ stepMs: 20 });
    const seen: PoseSnapshot[] = [];
    const off = src.subscribe((s) => seen.push(s));
    await src.start();
    vi.advanceTimersByTime(40);
    off();
    const before = seen.length;
    vi.advanceTimersByTime(200);
    await src.stop();
    expect(seen.length).toBe(before);
  });

  it('start is idempotent', async () => {
    const src = new MockPoseSource({ stepMs: 20 });
    const seen: PoseSnapshot[] = [];
    src.subscribe((s) => seen.push(s));
    await src.start();
    await src.start();
    vi.advanceTimersByTime(40);
    await src.stop();
    expect(seen.length).toBeLessThanOrEqual(3);
  });
});
