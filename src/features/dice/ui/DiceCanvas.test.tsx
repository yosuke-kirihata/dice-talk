import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SceneManager } from '@/features/dice/scene/SceneManager';
import { ScriptedPoseSource } from '@/features/pose';
import { DiceCanvas } from './DiceCanvas';

const fakeSceneManager = (): SceneManager => {
  const fake = {
    attach: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    detach: vi.fn(),
    resize: vi.fn(),
    configure: vi.fn(),
  };
  // biome-ignore lint/suspicious/noExplicitAny: test fake
  return fake as any;
};

describe('DiceCanvas', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders a canvas element', () => {
    const src = new ScriptedPoseSource([{ quat: [0, 0, 0, 1], timestamp: 0 }]);
    const { container } = render(
      <DiceCanvas poseSource={src} sceneManagerFactory={fakeSceneManager} />,
    );
    expect(container.querySelector('canvas')).not.toBeNull();
  });

  it('mounts SceneManager.attach and start(poseSource)', () => {
    const sm = fakeSceneManager();
    const src = new ScriptedPoseSource([{ quat: [0, 0, 0, 1], timestamp: 0 }]);
    render(<DiceCanvas poseSource={src} sceneManagerFactory={() => sm} />);
    expect(sm.attach).toHaveBeenCalledOnce();
    expect(sm.start).toHaveBeenCalledWith(src);
  });

  it('starts and stops the PoseSource lifecycle', () => {
    const sm = fakeSceneManager();
    const src = new ScriptedPoseSource([{ quat: [0, 0, 0, 1], timestamp: 0 }]);
    const start = vi.spyOn(src, 'start');
    const stop = vi.spyOn(src, 'stop');
    const { unmount } = render(<DiceCanvas poseSource={src} sceneManagerFactory={() => sm} />);

    expect(start).toHaveBeenCalledOnce();
    unmount();
    expect(stop).toHaveBeenCalledOnce();
  });

  it('observes canvas size changes and calls resize', () => {
    const callbacks: ResizeObserverCallback[] = [];
    const observe = vi.fn();
    const disconnect = vi.fn();
    class MockResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        callbacks.push(cb);
      }

      observe = observe;
      unobserve = vi.fn();
      disconnect = disconnect;
    }
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    const sm = fakeSceneManager();
    const src = new ScriptedPoseSource([{ quat: [0, 0, 0, 1], timestamp: 0 }]);
    const { container, unmount } = render(
      <DiceCanvas poseSource={src} sceneManagerFactory={() => sm} />,
    );
    const canvas = container.querySelector('canvas');
    const callback = callbacks[0];
    if (!canvas || !callback) throw new Error('resize observer was not installed');

    expect(observe).toHaveBeenCalledWith(canvas);
    callback([], {} as ResizeObserver);
    expect(sm.resize).toHaveBeenCalled();
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('applies scene option updates without remounting the SceneManager', () => {
    const sm = fakeSceneManager();
    const factory = () => sm;
    const src = new ScriptedPoseSource([{ quat: [0, 0, 0, 1], timestamp: 0 }]);
    const { rerender } = render(
      <DiceCanvas
        poseSource={src}
        sceneManagerFactory={factory}
        sceneOptions={{ diceGeometryOptions: { size: 1, radius: 0 } }}
      />,
    );

    rerender(
      <DiceCanvas
        poseSource={src}
        sceneManagerFactory={factory}
        sceneOptions={{ diceGeometryOptions: { size: 2, radius: 0.1 } }}
      />,
    );

    expect(sm.attach).toHaveBeenCalledOnce();
    expect(sm.configure).toHaveBeenLastCalledWith({
      diceGeometryOptions: { size: 2, radius: 0.1 },
    });
  });

  it('detaches SceneManager on unmount', () => {
    const sm = fakeSceneManager();
    const src = new ScriptedPoseSource([{ quat: [0, 0, 0, 1], timestamp: 0 }]);
    const { unmount } = render(<DiceCanvas poseSource={src} sceneManagerFactory={() => sm} />);
    unmount();
    expect(sm.detach).toHaveBeenCalled();
  });
});
