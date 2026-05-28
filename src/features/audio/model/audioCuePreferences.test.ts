import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_AUDIO_CUE_CONFIG } from './audioCueConfig';
import { loadAudioCueConfig, saveAudioCueConfig } from './audioCuePreferences';

const KEY = 'audio.cue.config.v1';

describe('audioCuePreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no value is stored', async () => {
    await expect(loadAudioCueConfig()).resolves.toBeNull();
  });

  it('loads and validates versioned stored config', async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        version: 1,
        config: { sourceId: 'cue', startSec: -1, endSec: -2, volume: 1.5, enabled: true },
      }),
    );

    await expect(loadAudioCueConfig()).resolves.toEqual({
      sourceId: 'cue',
      startSec: 0,
      endSec: 0.1,
      volume: 1,
      enabled: true,
    });
  });

  it('returns null for malformed or wrong-version values', async () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 2, config: {} }));
    await expect(loadAudioCueConfig()).resolves.toBeNull();

    localStorage.setItem(KEY, '{');
    await expect(loadAudioCueConfig()).resolves.toBeNull();
  });

  it('returns null for configs with invalid field types', async () => {
    const invalidConfigs = [
      null,
      { sourceId: 123, startSec: 0, endSec: 1, volume: 1, enabled: true },
      { sourceId: null, startSec: '0', endSec: 1, volume: 1, enabled: true },
      { sourceId: null, startSec: 0, endSec: '1', volume: 1, enabled: true },
      { sourceId: null, startSec: 0, endSec: 1, volume: '1', enabled: true },
      { sourceId: null, startSec: 0, endSec: 1, volume: 1, enabled: 'true' },
    ];

    for (const config of invalidConfigs) {
      localStorage.setItem(KEY, JSON.stringify({ version: 1, config }));
      await expect(loadAudioCueConfig()).resolves.toBeNull();
    }
  });

  it('returns null when the stored envelope is not an object', async () => {
    localStorage.setItem(KEY, JSON.stringify(null));

    await expect(loadAudioCueConfig()).resolves.toBeNull();
  });

  it('saves a versioned validated payload', async () => {
    await saveAudioCueConfig({ ...DEFAULT_AUDIO_CUE_CONFIG, volume: 2 });
    expect(localStorage.getItem(KEY)).toBe(
      JSON.stringify({ version: 1, config: { ...DEFAULT_AUDIO_CUE_CONFIG, volume: 1 } }),
    );
  });
});
