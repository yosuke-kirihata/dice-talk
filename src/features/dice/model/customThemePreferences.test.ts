import { beforeEach, describe, expect, it } from 'vitest';
import {
  CUSTOM_THEME_FACE_TEXT_MAX_LENGTH,
  CUSTOM_THEME_NAME_MAX_LENGTH,
  type CustomTheme,
  loadCustomThemes,
  saveCustomThemes,
} from './customThemePreferences';
import { DEFAULT_FACE_COLORS_BY_PIP, DEFAULT_FACE_TEXTS } from './designState';

const KEY = 'dice-talk.customThemes.v1';

const theme = (overrides: Partial<CustomTheme> = {}): CustomTheme => ({
  id: 'theme-1',
  name: 'マイテーマ',
  faceTexts: DEFAULT_FACE_TEXTS,
  faceColors: DEFAULT_FACE_COLORS_BY_PIP,
  ...overrides,
});

describe('customThemePreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no value is stored', async () => {
    await expect(loadCustomThemes()).resolves.toBeNull();
  });

  it('loads valid custom themes and normalizes colors and bounded text fields', async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        version: 1,
        themes: [
          {
            id: 'theme-1',
            name: `  ${'長'.repeat(CUSTOM_THEME_NAME_MAX_LENGTH + 5)}  `,
            faceTexts: { 1: 'あ'.repeat(CUSTOM_THEME_FACE_TEXT_MAX_LENGTH + 5) },
            faceColors: { 1: '#ABCDEF', 2: 'bad' },
          },
        ],
      }),
    );

    await expect(loadCustomThemes()).resolves.toEqual([
      {
        id: 'theme-1',
        name: '長'.repeat(CUSTOM_THEME_NAME_MAX_LENGTH),
        faceTexts: {
          ...DEFAULT_FACE_TEXTS,
          1: 'あ'.repeat(CUSTOM_THEME_FACE_TEXT_MAX_LENGTH),
        },
        faceColors: {
          ...DEFAULT_FACE_COLORS_BY_PIP,
          1: '#abcdef',
        },
      },
    ]);
  });

  it('drops malformed themes and rejects invalid stored envelopes', async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        version: 1,
        themes: [
          theme(),
          { ...theme(), id: '' },
          { ...theme(), id: 'x'.repeat(81) },
          { ...theme(), name: '' },
          { ...theme(), faceTexts: null },
          { ...theme(), faceColors: null },
        ],
      }),
    );

    await expect(loadCustomThemes()).resolves.toEqual([theme()]);

    localStorage.setItem(KEY, JSON.stringify({ version: 2, themes: [theme()] }));
    await expect(loadCustomThemes()).resolves.toBeNull();
  });

  it('returns null for invalid JSON', async () => {
    localStorage.setItem(KEY, '{');
    await expect(loadCustomThemes()).resolves.toBeNull();
  });

  it('saves custom themes as versioned JSON', async () => {
    await saveCustomThemes([theme({ id: 'theme-2' })]);

    expect(localStorage.getItem(KEY)).toBe(
      JSON.stringify({
        version: 1,
        themes: [theme({ id: 'theme-2' })],
      }),
    );
  });
});
