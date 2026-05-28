import { BoxGeometry, Color, MeshStandardMaterial } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { describe, expect, it } from 'vitest';
import { createDiceGeometry, DEFAULT_FACE_COLORS, DICE_FACE_DEFINITIONS } from './diceGeometry';

describe('createDiceGeometry', () => {
  it('returns a BoxGeometry and exactly 6 materials', () => {
    const { geometry, materials } = createDiceGeometry();
    expect(geometry).toBeInstanceOf(BoxGeometry);
    expect(materials).toHaveLength(6);
    for (const m of materials) {
      expect(m).toBeInstanceOf(MeshStandardMaterial);
    }
  });

  it('default materials use DEFAULT_FACE_COLORS palette', () => {
    const { materials } = createDiceGeometry();
    materials.forEach((m, i) => {
      const expected = new Color(DEFAULT_FACE_COLORS[i]);
      expect((m as MeshStandardMaterial).color.getHexString()).toBe(expected.getHexString());
    });
  });

  it('applies custom faceColors when provided', () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'] as const;
    const { materials } = createDiceGeometry({ faceColors: colors });
    materials.forEach((m, i) => {
      expect((m as MeshStandardMaterial).color.getHexString()).toBe(
        new Color(colors[i]).getHexString(),
      );
    });
  });

  it('respects custom size', () => {
    const { geometry } = createDiceGeometry({ size: 2 });
    if (!(geometry instanceof BoxGeometry)) throw new Error('expected BoxGeometry');
    expect(geometry.parameters.width).toBe(2);
    expect(geometry.parameters.height).toBe(2);
    expect(geometry.parameters.depth).toBe(2);
  });

  it('returns BoxGeometry when radius is 0 (default)', () => {
    const { geometry } = createDiceGeometry({ radius: 0 });
    expect(geometry).toBeInstanceOf(BoxGeometry);
  });

  it('returns RoundedBoxGeometry when radius > 0', () => {
    const { geometry } = createDiceGeometry({ radius: 0.2 });
    expect(geometry).toBeInstanceOf(RoundedBoxGeometry);
  });

  it('clamps radius >= size/2 so geometry stays valid', () => {
    expect(() => createDiceGeometry({ size: 1, radius: 0.5 })).not.toThrow();
    expect(() => createDiceGeometry({ size: 1, radius: 10 })).not.toThrow();
  });

  it('preserves 6 materials when rounded', () => {
    const { materials } = createDiceGeometry({ radius: 0.2 });
    expect(materials).toHaveLength(6);
  });

  it('defines a stable material, pip, and normal mapping for each face', () => {
    expect(DICE_FACE_DEFINITIONS).toHaveLength(6);
    expect(DICE_FACE_DEFINITIONS.map((f) => f.materialIndex)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(new Set(DICE_FACE_DEFINITIONS.map((f) => f.pip))).toEqual(new Set([1, 2, 3, 4, 5, 6]));
    for (const face of DICE_FACE_DEFINITIONS) {
      expect(Math.hypot(...face.normal)).toBe(1);
    }
  });
});
