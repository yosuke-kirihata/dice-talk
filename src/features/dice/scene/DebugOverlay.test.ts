import { ArrowHelper, Mesh, type Object3D, Scene, Vector3 } from 'three';
import { describe, expect, it, vi } from 'vitest';
import type { Quat } from '@/shared/pose';
import { DebugOverlay } from './DebugOverlay';

const makeFixture = () => {
  const scene = new Scene();
  const dice = new Mesh();
  scene.add(dice);
  return { scene, dice };
};

const collectArrows = (root: Object3D): ArrowHelper[] => {
  const out: ArrowHelper[] = [];
  root.traverse((c) => {
    if (c instanceof ArrowHelper) out.push(c);
  });
  return out;
};

const findUpArrow = (scene: Scene): ArrowHelper | undefined => {
  for (const c of scene.children) if (c instanceof ArrowHelper) return c;
  return undefined;
};

describe('DebugOverlay', () => {
  it('adds 3 axis arrows to the scene when worldAxes is true', () => {
    const { scene, dice } = makeFixture();
    new DebugOverlay(scene, dice, { worldAxes: true });
    expect(collectArrows(scene).length).toBe(3);
  });

  it('adds 3 axis arrows under dice when localAxes is true', () => {
    const { scene, dice } = makeFixture();
    new DebugOverlay(scene, dice, { localAxes: true });
    expect(collectArrows(dice).length).toBe(3);
  });

  it('adds an ArrowHelper directly to the scene when upArrow is true', () => {
    const { scene, dice } = makeFixture();
    new DebugOverlay(scene, dice, { upArrow: true });
    const upArrow = findUpArrow(scene);
    expect(upArrow).toBeDefined();
  });

  it('update(unit quat) keeps up arrow direction at +Y', () => {
    const { scene, dice } = makeFixture();
    const overlay = new DebugOverlay(scene, dice, { upArrow: true });
    overlay.update([0, 0, 0, 1]);
    const arrow = findUpArrow(scene);
    if (!arrow) throw new Error('up arrow missing');
    const dir = new Vector3(0, 1, 0).applyQuaternion(arrow.quaternion);
    expect(dir.x).toBeCloseTo(0, 6);
    expect(dir.y).toBeCloseTo(1, 6);
    expect(dir.z).toBeCloseTo(0, 6);
  });

  it('update(180deg around X) flips up arrow direction to -Y', () => {
    const { scene, dice } = makeFixture();
    const overlay = new DebugOverlay(scene, dice, { upArrow: true });
    const q: Quat = [1, 0, 0, 0];
    overlay.update(q);
    const arrow = findUpArrow(scene);
    if (!arrow) throw new Error('up arrow missing');
    const dir = new Vector3(0, 1, 0).applyQuaternion(arrow.quaternion);
    expect(dir.x).toBeCloseTo(0, 6);
    expect(dir.y).toBeCloseTo(-1, 6);
    expect(dir.z).toBeCloseTo(0, 6);
  });

  it('dispose removes all arrows from scene and dice', () => {
    const { scene, dice } = makeFixture();
    const overlay = new DebugOverlay(scene, dice, {
      worldAxes: true,
      localAxes: true,
      upArrow: true,
    });
    const allArrows = collectArrows(scene);
    expect(allArrows.length).toBe(7);
    const disposeSpies = allArrows.map((a) => vi.spyOn(a, 'dispose'));

    overlay.dispose();

    expect(collectArrows(scene).length).toBe(0);
    expect(collectArrows(dice).length).toBe(0);
    for (const spy of disposeSpies) expect(spy).toHaveBeenCalled();
  });
});
