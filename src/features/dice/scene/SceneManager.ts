import {
  AmbientLight,
  Color,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { createDiceGeometry, type DiceGeometryOptions } from '@/features/dice/model/diceGeometry';
import type { PoseSource } from '@/shared/pose';
import { DebugOverlay, type DebugOverlayOptions } from './DebugOverlay';
import { DiceMesh } from './DiceMesh';

/** canvas から Three.js WebGLRenderer を生成するための差し替え可能な factory。 */
export type RendererFactory = (canvas: HTMLCanvasElement) => WebGLRenderer;

/** SceneManager の生成時に指定できる描画・ジオメトリ・デバッグ表示オプション。 */
export interface SceneManagerOptions {
  readonly rendererFactory?: RendererFactory;
  readonly diceGeometryOptions?: DiceGeometryOptions;
  readonly debug?: DebugOverlayOptions;
}

/** 生成後に再設定できる SceneManager オプション。rendererFactory は含めない。 */
export type SceneManagerConfig = Omit<SceneManagerOptions, 'rendererFactory'>;

const defaultRendererFactory: RendererFactory = (canvas) =>
  new WebGLRenderer({ canvas, antialias: true });

/** Three.js シーン、カメラ、レンダラー、サイコロ mesh をまとめて管理する。 */
export class SceneManager {
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;
  private readonly rendererFactory: RendererFactory;
  private renderer: WebGLRenderer | null = null;
  private diceMesh: DiceMesh | null;
  private debugOverlay: DebugOverlay | null;
  private debugOptions: DebugOverlayOptions | undefined;
  private diceGeometryOptions: DiceGeometryOptions | undefined;
  private canvas: HTMLCanvasElement | null = null;
  private poseSource: PoseSource | null = null;
  private rafId: number | null = null;

  constructor(opts: SceneManagerOptions = {}) {
    this.rendererFactory = opts.rendererFactory ?? defaultRendererFactory;
    this.scene = new Scene();
    this.scene.background = new Color(0xffffff);
    this.camera = new PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.set(0, 0, 3);
    const ambient = new AmbientLight(0xffffff, 0.6);
    const dir = new DirectionalLight(0xffffff, 0.9);
    dir.position.set(2, 3, 4);
    this.scene.add(ambient, dir);
    this.diceGeometryOptions = opts.diceGeometryOptions;
    this.diceMesh = this.createDiceMesh(opts.diceGeometryOptions);
    this.scene.add(this.diceMesh.mesh);
    this.debugOptions = opts.debug;
    this.debugOverlay = this.debugOptions
      ? new DebugOverlay(this.scene, this.diceMesh.mesh, this.debugOptions)
      : null;
  }

  configure(opts: SceneManagerConfig = {}): void {
    const labelsChanged =
      opts.diceGeometryOptions?.faceTexts !== undefined &&
      opts.diceGeometryOptions.faceTexts !== this.diceGeometryOptions?.faceTexts;
    const geometryChanged =
      opts.diceGeometryOptions !== undefined &&
      (opts.diceGeometryOptions.size !== this.diceGeometryOptions?.size ||
        opts.diceGeometryOptions.radius !== this.diceGeometryOptions?.radius ||
        opts.diceGeometryOptions.faceColors !== this.diceGeometryOptions?.faceColors);
    const debugChanged = opts.debug !== undefined;
    if (!geometryChanged && !labelsChanged && !debugChanged) return;

    if (geometryChanged && this.diceMesh) {
      const next = this.createDiceMesh(opts.diceGeometryOptions);
      next.mesh.quaternion.copy(this.diceMesh.mesh.quaternion);
      this.scene.remove(this.diceMesh.mesh);
      this.diceMesh.dispose();
      this.diceMesh = next;
      this.scene.add(next.mesh);
    } else if (labelsChanged && this.diceMesh) {
      this.diceMesh.updateFaceTexts(opts.diceGeometryOptions?.faceTexts, {
        size: opts.diceGeometryOptions?.size ?? this.diceGeometryOptions?.size ?? 1,
        radius: opts.diceGeometryOptions?.radius ?? this.diceGeometryOptions?.radius ?? 0,
      });
    }
    if (opts.diceGeometryOptions !== undefined) this.diceGeometryOptions = opts.diceGeometryOptions;
    if (debugChanged) this.debugOptions = opts.debug;
    if (!geometryChanged && !debugChanged) return;

    this.debugOverlay?.dispose();
    this.debugOverlay =
      this.debugOptions && this.diceMesh
        ? new DebugOverlay(this.scene, this.diceMesh.mesh, this.debugOptions)
        : null;
  }

  attach(canvas: HTMLCanvasElement): void {
    if (this.canvas) return;
    this.canvas = canvas;
    this.renderer = this.rendererFactory(canvas);
    this.resize();
  }

  start(poseSource: PoseSource): void {
    this.poseSource = poseSource;
    if (this.rafId === null) this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.poseSource = null;
  }

  detach(): void {
    this.stop();
    if (this.debugOverlay) {
      this.debugOverlay.dispose();
      this.debugOverlay = null;
    }
    if (this.diceMesh) {
      this.scene.remove(this.diceMesh.mesh);
      this.diceMesh.dispose();
      this.diceMesh = null;
    }
    this.renderer?.dispose();
    this.renderer = null;
    this.canvas = null;
  }

  resize(): void {
    if (!this.canvas || !this.renderer) return;
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    const aspect = w / h;
    this.camera.aspect = aspect;
    this.camera.position.z = this.fitCameraDistance(aspect);
    this.camera.updateProjectionMatrix();
  }

  private fitCameraDistance(aspect: number): number {
    const targetHalfH = 0.9;
    const targetHalfW = 0.7;
    const halfFov = Math.tan(((this.camera.fov ?? 50) * Math.PI) / 360);
    const dV = targetHalfH / halfFov;
    const dH = targetHalfW / (aspect * halfFov);
    return Math.max(dV, dH) * 1.1;
  }

  private createDiceMesh(opts: DiceGeometryOptions = {}): DiceMesh {
    const meshOpts = {
      size: opts.size ?? 1,
      radius: opts.radius ?? 0,
      ...(opts.faceTexts !== undefined && { faceTexts: opts.faceTexts }),
    };
    return new DiceMesh(createDiceGeometry(opts), meshOpts);
  }

  private readonly tick = (): void => {
    if (this.poseSource && this.diceMesh) {
      const quat = this.poseSource.getCurrentPose().quat;
      this.diceMesh.setPose(quat);
      this.debugOverlay?.update(quat);
    }
    if (this.renderer) this.renderer.render(this.scene, this.camera);
    this.rafId = requestAnimationFrame(this.tick);
  };
}
