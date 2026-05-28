import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_FACE_TEXTS } from './designState';
import { loadFaceTexts, saveFaceTexts } from './faceTextPreferences';

const KEY = 'dice-talk.faceTexts.v1';

describe('faceTextPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no value is stored', async () => {
    await expect(loadFaceTexts()).resolves.toBeNull();
  });

  it('loads stored face text and merges missing values with defaults', async () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, faceTexts: { 1: '勝', 3: '休み' } }));

    await expect(loadFaceTexts()).resolves.toEqual({
      ...DEFAULT_FACE_TEXTS,
      1: '勝',
      3: '休み',
    });
  });

  it('returns null for invalid stored JSON', async () => {
    localStorage.setItem(KEY, '{');
    await expect(loadFaceTexts()).resolves.toBeNull();
  });

  it('saves face text as versioned JSON', async () => {
    await saveFaceTexts({ ...DEFAULT_FACE_TEXTS, 2: '大吉\n小吉' });

    expect(localStorage.getItem(KEY)).toBe(
      JSON.stringify({
        version: 1,
        faceTexts: { ...DEFAULT_FACE_TEXTS, 2: '大吉\n小吉' },
      }),
    );
  });
});
