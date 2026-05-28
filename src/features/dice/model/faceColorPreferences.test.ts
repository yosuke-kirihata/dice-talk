import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_FACE_COLORS_BY_PIP } from './designState';
import { loadFaceColors, saveFaceColors } from './faceColorPreferences';

const KEY = 'dice-talk.faceColors.v1';

describe('faceColorPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no value is stored', async () => {
    await expect(loadFaceColors()).resolves.toBeNull();
  });

  it('loads stored face colors and merges missing values with defaults', async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ version: 1, faceColors: { 1: '#111111', 3: '#abcdef' } }),
    );

    await expect(loadFaceColors()).resolves.toEqual({
      ...DEFAULT_FACE_COLORS_BY_PIP,
      1: '#111111',
      3: '#abcdef',
    });
  });

  it('ignores invalid color values', async () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, faceColors: { 1: 'red' } }));
    await expect(loadFaceColors()).resolves.toEqual(DEFAULT_FACE_COLORS_BY_PIP);
  });

  it('saves face colors as versioned JSON', async () => {
    await saveFaceColors({ ...DEFAULT_FACE_COLORS_BY_PIP, 2: '#123456' });

    expect(localStorage.getItem(KEY)).toBe(
      JSON.stringify({
        version: 1,
        faceColors: { ...DEFAULT_FACE_COLORS_BY_PIP, 2: '#123456' },
      }),
    );
  });
});
