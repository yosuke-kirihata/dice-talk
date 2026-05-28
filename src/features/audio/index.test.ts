import { describe, expect, it } from 'vitest';
import {
  AudioCuePlayer,
  AudioCueSection,
  createAudioFileStore,
  DEFAULT_AUDIO_CUE_CONFIG,
} from './index';

describe('audio barrel', () => {
  it('exports the public audio feature surface', () => {
    expect(DEFAULT_AUDIO_CUE_CONFIG.enabled).toBe(false);
    expect(AudioCuePlayer).toBeTypeOf('function');
    expect(AudioCueSection).toBeTypeOf('function');
    expect(createAudioFileStore).toBeTypeOf('function');
  });
});
