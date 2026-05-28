import { ArrowHelper, Group, type Mesh, type Scene, Vector3 } from 'three';
import { type Quat, toThree } from '@/shared/pose';

/** シーン上に表示するデバッグ補助線の種類を指定する。 */
export interface DebugOverlayOptions {
  readonly worldAxes?: boolean;
  readonly localAxes?: boolean;
  readonly upArrow?: boolean;
}

const AXIS_X = new Vector3(1, 0, 0);
const AXIS_Y = new Vector3(0, 1, 0);
const AXIS_Z = new Vector3(0, 0, 1);
const ORIGIN = new Vector3(0, 0, 0);

const makeAxesArrows = (length: number, head: number, width: number): Group => {
  const g = new Group();
  g.add(new ArrowHelper(AXIS_X, ORIGIN, length, 0xcc0000, head, width));
  g.add(new ArrowHelper(AXIS_Y, ORIGIN, length, 0x009933, head, width));
  g.add(new ArrowHelper(AXIS_Z, ORIGIN, length, 0x0044cc, head, width));
  return g;
};

const disposeArrows = (g: Group): void => {
  for (const child of g.children) {
    if (child instanceof ArrowHelper) child.dispose();
  }
};

/** ワールド軸、ローカル軸、上方向矢印を Three.js シーンに追加・更新・破棄する。 */
export class DebugOverlay {
  private readonly worldAxes: Group | null;
  private readonly localAxes: Group | null;
  private readonly upArrow: ArrowHelper | null;

  constructor(scene: Scene, dice: Mesh, opts: DebugOverlayOptions) {
    this.worldAxes = opts.worldAxes ? makeAxesArrows(1.5, 0.18, 0.12) : null;
    if (this.worldAxes) scene.add(this.worldAxes);
    this.localAxes = opts.localAxes ? makeAxesArrows(0.85, 0.12, 0.08) : null;
    if (this.localAxes) dice.add(this.localAxes);
    this.upArrow = opts.upArrow
      ? new ArrowHelper(AXIS_Y, ORIGIN, 0.85, 0x222222, 0.12, 0.08)
      : null;
    if (this.upArrow) scene.add(this.upArrow);
  }

  update(quat: Quat): void {
    if (!this.upArrow) return;
    const dir = new Vector3(0, 1, 0).applyQuaternion(toThree(quat));
    this.upArrow.setDirection(dir);
  }

  dispose(): void {
    if (this.worldAxes) {
      disposeArrows(this.worldAxes);
      this.worldAxes.removeFromParent();
    }
    if (this.localAxes) {
      disposeArrows(this.localAxes);
      this.localAxes.removeFromParent();
    }
    if (this.upArrow) {
      this.upArrow.removeFromParent();
      this.upArrow.dispose();
    }
  }
}
