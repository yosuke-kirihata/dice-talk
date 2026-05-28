import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SceneManager } from '@/features/dice/scene/SceneManager';
import { ScriptedPoseSource } from '@/features/pose/sources/scriptedPoseSource';
import { TouchPoseSource } from '@/features/pose/sources/touchPoseSource';
import type { PoseSnapshot } from '@/shared/pose';

const SCRIPTED: readonly PoseSnapshot[] = [
  { quat: [0, 0, 0, 1], timestamp: 0 },
  { quat: [0, Math.SQRT1_2, 0, Math.SQRT1_2], timestamp: 16 },
];

const fakeRenderer = (canvas: HTMLCanvasElement) => ({
  setSize: vi.fn(),
  render: vi.fn(),
  dispose: vi.fn(),
  domElement: canvas,
});

describe('PoseSource integration: renderer is agnostic to input source', () => {
  let canvas: HTMLCanvasElement;
  let rafCallbacks: FrameRequestCallback[];

  beforeEach(() => {
    canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'clientWidth', { value: 200, configurable: true });
    Object.defineProperty(canvas, 'clientHeight', { value: 200, configurable: true });
    rafCallbacks = [];
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const newSm = () =>
    new SceneManager({
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      rendererFactory: (c) => fakeRenderer(c) as any,
    });

  it('SceneManager works with TouchPoseSource', () => {
    const sm = newSm();
    sm.attach(canvas);
    const src = new TouchPoseSource();
    sm.start(src);
    src.applyDelta(20, 10);
    rafCallbacks.shift()?.(performance.now());
    expect(rafCallbacks.length).toBeGreaterThan(0);
  });

  it('SceneManager works with ScriptedPoseSource using identical renderer code', () => {
    const sm = newSm();
    sm.attach(canvas);
    const src = new ScriptedPoseSource(SCRIPTED);
    const spy = vi.spyOn(src, 'getCurrentPose');
    sm.start(src);
    rafCallbacks.shift()?.(performance.now());
    rafCallbacks.shift()?.(performance.now());
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(2);
    sm.detach();
  });
});
