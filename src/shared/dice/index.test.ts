import { describe, expect, it } from 'vitest';
import { DICE_FACE_DEFINITIONS, DICE_PIPS, getFaceOrientationByPip } from './index';

describe('shared dice', () => {
  it('maps pips to face orientations and returns null for unknown pips', () => {
    for (const pip of DICE_PIPS) {
      expect(getFaceOrientationByPip(pip)?.pip).toBe(pip);
    }
    expect(getFaceOrientationByPip(999 as (typeof DICE_PIPS)[number])).toBeNull();
    expect(DICE_FACE_DEFINITIONS).toHaveLength(6);
  });
});
