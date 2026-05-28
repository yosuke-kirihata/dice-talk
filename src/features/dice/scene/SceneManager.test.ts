import { ArrowHelper, type Object3D, type PerspectiveCamera, type Scene } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type PoseSnapshot, ScriptedPoseSource } from '@/features/pose';
import { SceneManager } from './SceneManager';

const countArrows = (root: Object3D): number => {
  let n = 0;
  root.traverse((c) => {
    if (c instanceof ArrowHelper) n++;
  });
  return n;
};

const SNAPS: readonly PoseSnapshot[] = [{ quat: [0, 0, 0, 1], timestamp: 0 }];

const makeMockRenderer = (canvas: HTMLCanvasElement) => ({
  setSize: vi.fn(),
  render: vi.fn(),
  dispose: vi.fn(),
  domElement: canvas,
});

describe('SceneManager', () => {
  let canvas: HTMLCanvasElement;
  let rafCallbacks: FrameRequestCallback[];

  beforeEach(() => {
    canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'clientWidth', { value: 320, configurable: true });
    Object.defineProperty(canvas, 'clientHeight', { value: 240, configurable: true });
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

  it('attach + start registers a requestAnimationFrame', () => {
    const sm = new SceneManager({
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      rendererFactory: (c) => makeMockRenderer(c) as any,
    });
    sm.attach(canvas);
    sm.start(new ScriptedPoseSource(SNAPS));
    expect(
      (globalThis.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBeGreaterThan(0);
  });

  it('resize calls renderer.setSize with the canvas client size', () => {
    const captured: ReturnType<typeof makeMockRenderer>[] = [];
    const sm = new SceneManager({
      rendererFactory: (c) => {
        const r = makeMockRenderer(c);
        captured.push(r);
        // biome-ignore lint/suspicious/noExplicitAny: test mock
        return r as any;
      },
    });
    sm.attach(canvas);
    sm.resize();
    expect(captured[0]?.setSize).toHaveBeenLastCalledWith(320, 240, false);
  });

  it('detach disposes the renderer', () => {
    const captured: ReturnType<typeof makeMockRenderer>[] = [];
    const sm = new SceneManager({
      rendererFactory: (c) => {
        const r = makeMockRenderer(c);
        captured.push(r);
        // biome-ignore lint/suspicious/noExplicitAny: test mock
        return r as any;
      },
    });
    sm.attach(canvas);
    sm.detach();
    expect(captured[0]?.dispose).toHaveBeenCalledOnce();
  });

  it('stop cancels the RAF loop', () => {
    const sm = new SceneManager({
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      rendererFactory: (c) => makeMockRenderer(c) as any,
    });
    sm.attach(canvas);
    sm.start(new ScriptedPoseSource(SNAPS));
    rafCallbacks.shift()?.(performance.now());
    sm.stop();
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('debug option attaches axis arrows and up arrow to the scene', () => {
    const sm = new SceneManager({
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      rendererFactory: (c) => makeMockRenderer(c) as any,
      debug: { worldAxes: true, upArrow: true },
    });
    sm.attach(canvas);
    const scene = (sm as unknown as { scene: Scene }).scene;
    expect(countArrows(scene)).toBe(4);
  });

  it('debug helpers are removed on detach', () => {
    const sm = new SceneManager({
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      rendererFactory: (c) => makeMockRenderer(c) as any,
      debug: { worldAxes: true, upArrow: true },
    });
    sm.attach(canvas);
    sm.detach();
    const scene = (sm as unknown as { scene: Scene }).scene;
    expect(countArrows(scene)).toBe(0);
  });

  it('configure replaces debug helpers without recreating renderer', () => {
    const captured: ReturnType<typeof makeMockRenderer>[] = [];
    const sm = new SceneManager({
      rendererFactory: (c) => {
        const r = makeMockRenderer(c);
        captured.push(r);
        // biome-ignore lint/suspicious/noExplicitAny: test mock
        return r as any;
      },
      debug: { worldAxes: true },
    });
    sm.attach(canvas);
    const scene = (sm as unknown as { scene: Scene }).scene;
    expect(countArrows(scene)).toBe(3);

    sm.configure({ debug: { upArrow: true } });

    expect(captured).toHaveLength(1);
    expect(countArrows(scene)).toBe(1);
  });

  it('configure replaces dice geometry without recreating renderer', () => {
    const captured: ReturnType<typeof makeMockRenderer>[] = [];
    const sm = new SceneManager({
      rendererFactory: (c) => {
        const r = makeMockRenderer(c);
        captured.push(r);
        // biome-ignore lint/suspicious/noExplicitAny: test mock
        return r as any;
      },
      diceGeometryOptions: { size: 1, radius: 0 },
    });
    sm.attach(canvas);

    sm.configure({ diceGeometryOptions: { size: 2, radius: 0.1 } });

    expect(captured).toHaveLength(1);
  });

  it('configure with only diceGeometryOptions preserves the existing debug overlay', () => {
    const sm = new SceneManager({
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      rendererFactory: (c) => makeMockRenderer(c) as any,
      diceGeometryOptions: { size: 1, radius: 0 },
      debug: { worldAxes: true, localAxes: true, upArrow: true },
    });
    sm.attach(canvas);
    const scene = (sm as unknown as { scene: Scene }).scene;
    expect(countArrows(scene)).toBe(7);

    sm.configure({ diceGeometryOptions: { size: 2, radius: 0.1 } });

    expect(countArrows(scene)).toBe(7);
  });

  it('configure with only debug option leaves the dice mesh untouched', () => {
    const sm = new SceneManager({
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      rendererFactory: (c) => makeMockRenderer(c) as any,
      diceGeometryOptions: { size: 1.5, radius: 0.2 },
    });
    sm.attach(canvas);
    const meshBefore = (sm as unknown as { diceMesh: { mesh: { uuid: string } } }).diceMesh.mesh;
    const uuidBefore = meshBefore.uuid;

    sm.configure({ debug: { worldAxes: true } });

    const meshAfter = (sm as unknown as { diceMesh: { mesh: { uuid: string } } }).diceMesh.mesh;
    expect(meshAfter.uuid).toBe(uuidBefore);
  });

  it('resize moves camera further back in portrait than in landscape', () => {
    const sm = new SceneManager({
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      rendererFactory: (c) => makeMockRenderer(c) as any,
    });
    const camera = (sm as unknown as { camera: PerspectiveCamera }).camera;
    sm.attach(canvas);
    Object.defineProperty(canvas, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(canvas, 'clientHeight', { value: 600, configurable: true });
    sm.resize();
    const landscapeZ = camera.position.z;
    Object.defineProperty(canvas, 'clientWidth', { value: 400, configurable: true });
    Object.defineProperty(canvas, 'clientHeight', { value: 900, configurable: true });
    sm.resize();
    const portraitZ = camera.position.z;
    expect(portraitZ).toBeGreaterThan(landscapeZ);
  });

  it('each tick pulls pose and calls renderer.render', () => {
    const captured: ReturnType<typeof makeMockRenderer>[] = [];
    const sm = new SceneManager({
      rendererFactory: (c) => {
        const r = makeMockRenderer(c);
        captured.push(r);
        // biome-ignore lint/suspicious/noExplicitAny: test mock
        return r as any;
      },
    });
    sm.attach(canvas);
    const src = new ScriptedPoseSource(SNAPS);
    const spy = vi.spyOn(src, 'getCurrentPose');
    sm.start(src);
    rafCallbacks.shift()?.(performance.now());
    rafCallbacks.shift()?.(performance.now());
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(captured[0]?.render.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
