import { describe, expect, it } from 'vitest';
import { createAudioFileStore } from './audioFileStore';
import { WebAudioFileStore } from './webAudioFileStore';

describe('createAudioFileStore', () => {
  it('returns the PWA IndexedDB-backed web store', () => {
    expect(createAudioFileStore()).toBeInstanceOf(WebAudioFileStore);
  });
});
