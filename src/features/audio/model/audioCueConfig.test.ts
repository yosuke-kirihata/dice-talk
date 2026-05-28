import { describe, expect, it } from 'vitest';
import {
  type AudioCueConfig,
  DEFAULT_AUDIO_CUE_CONFIG,
  validateAudioCueConfig,
} from './audioCueConfig';

describe('audioCueConfig', () => {
  it('provides a disabled zero-length default cue', () => {
    expect(DEFAULT_AUDIO_CUE_CONFIG).toEqual({
      sourceId: null,
      startSec: 0,
      endSec: 0,
      volume: 0.8,
      enabled: false,
    });
  });

  it('clamps invalid timing and volume without mutating the input', () => {
    const input: AudioCueConfig = {
      sourceId: 'cue-1',
      startSec: -2,
      endSec: -1,
      volume: 1.8,
      enabled: true,
    };

    expect(validateAudioCueConfig(input)).toEqual({
      sourceId: 'cue-1',
      startSec: 0,
      endSec: 0.1,
      volume: 1,
      enabled: true,
    });
    expect(input.startSec).toBe(-2);
  });

  it('preserves equal start and end seconds', () => {
    expect(
      validateAudioCueConfig({
        sourceId: null,
        startSec: 0,
        endSec: 0,
        volume: 0.5,
        enabled: false,
      }),
    ).toEqual({
      sourceId: null,
      startSec: 0,
      endSec: 0,
      volume: 0.5,
      enabled: false,
    });
  });

  it('keeps endSec after startSec when start is larger than end', () => {
    expect(
      validateAudioCueConfig({
        sourceId: null,
        startSec: 5,
        endSec: 4,
        volume: -0.2,
        enabled: false,
      }),
    ).toEqual({
      sourceId: null,
      startSec: 5,
      endSec: 5.1,
      volume: 0,
      enabled: false,
    });
  });
});
