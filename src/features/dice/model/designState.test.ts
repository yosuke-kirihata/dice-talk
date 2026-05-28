import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DICE_DESIGN,
  DEFAULT_FACE_COLORS_BY_PIP,
  DEFAULT_FACE_TEXTS,
  faceColorMapToFaceColors,
} from './designState';
import { DEFAULT_FACE_COLORS, DICE_FACE_DEFINITIONS, type DicePip } from './diceGeometry';

const PIPS = [1, 2, 3, 4, 5, 6] as const satisfies readonly DicePip[];

describe('designState defaults', () => {
  it('DEFAULT_FACE_TEXTS has default text for each pip', () => {
    expect(DEFAULT_FACE_TEXTS).toEqual({
      1: '最近うれしかったことは？',
      2: 'おすすめの映画は？',
      3: '子どもの頃の夢は？',
      4: '行ってみたい場所は？',
      5: '今、はまっていることは？',
      6: '明日から1週間、何をしたい？',
    });
    for (const pip of PIPS) {
      expect(DEFAULT_FACE_TEXTS[pip]).not.toBe('');
    }
  });

  it('DEFAULT_FACE_COLORS_BY_PIP has hex colors for each pip', () => {
    for (const face of DICE_FACE_DEFINITIONS) {
      expect(DEFAULT_FACE_COLORS_BY_PIP[face.pip]).toBe(DEFAULT_FACE_COLORS[face.materialIndex]);
    }
    for (const pip of PIPS) {
      const color = DEFAULT_FACE_COLORS_BY_PIP[pip];
      expect(color).toMatch(/^#.+/);
    }
  });

  it('faceColorMapToFaceColors returns colors in material index order', () => {
    const colors = faceColorMapToFaceColors(DEFAULT_FACE_COLORS_BY_PIP);

    expect(colors).toHaveLength(6);
    for (const face of DICE_FACE_DEFINITIONS) {
      expect(colors[face.materialIndex]).toBe(DEFAULT_FACE_COLORS_BY_PIP[face.pip]);
      expect(colors[face.materialIndex]).toMatch(/^#.+/);
    }
  });

  it('DEFAULT_DICE_DESIGN has the expected shape and defaults', () => {
    expect(DEFAULT_DICE_DESIGN.radius).toBe(0.15);
    expect(DEFAULT_DICE_DESIGN.size).toBe(1);
    expect(DEFAULT_DICE_DESIGN.faceTexts).toEqual(DEFAULT_FACE_TEXTS);
    expect(DEFAULT_DICE_DESIGN.faceColors).toEqual(DEFAULT_FACE_COLORS_BY_PIP);
  });
});
