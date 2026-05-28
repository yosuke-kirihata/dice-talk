import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_AUDIO_CUE_CONFIG } from '../model/audioCueConfig';
import { AudioCuePlayer, type Howl, type HowlOptions } from './audioCuePlayer';

const createHowl = () => ({
  play: vi.fn(),
  stop: vi.fn(),
  unload: vi.fn(),
});

describe('AudioCuePlayer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  });

  it('creates an html5 Howl with cue sprite from the selected range', async () => {
    const howl = createHowl();
    const factory = vi.fn<(opts: HowlOptions) => Howl>(() => howl);
    const player = new AudioCuePlayer(factory);

    await player.prepare('blob:cue', {
      ...DEFAULT_AUDIO_CUE_CONFIG,
      startSec: 1.2,
      endSec: 2.7,
      volume: 0.5,
    });

    expect(factory).toHaveBeenCalledWith({
      src: ['blob:cue'],
      html5: true,
      volume: 0.5,
      sprite: { cue: [1200, 1500] },
    });
  });

  it('unloads the current Howl before preparing a changed cue', async () => {
    const first = createHowl();
    const second = createHowl();
    const factory = vi
      .fn<(opts: HowlOptions) => Howl>()
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second);
    const player = new AudioCuePlayer(factory);

    await player.prepare('blob:first', DEFAULT_AUDIO_CUE_CONFIG);
    await player.prepare('blob:second', DEFAULT_AUDIO_CUE_CONFIG);

    expect(first.unload).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:first');
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('does not revoke a blob URL when preparing the same URL again', async () => {
    const first = createHowl();
    const second = createHowl();
    const factory = vi
      .fn<(opts: HowlOptions) => Howl>()
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second);
    const player = new AudioCuePlayer(factory);

    await player.prepare('blob:same', DEFAULT_AUDIO_CUE_CONFIG);
    await player.prepare('blob:same', DEFAULT_AUDIO_CUE_CONFIG);

    expect(first.unload).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    player.unload();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:same');
  });

  it('does not revoke non-blob URLs', async () => {
    const player = new AudioCuePlayer(() => createHowl());

    await player.prepare('/cue.mp3', DEFAULT_AUDIO_CUE_CONFIG);
    player.unload();

    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it('plays and stops the cue sprite', async () => {
    const howl = createHowl();
    const player = new AudioCuePlayer(() => howl);

    await player.prepare('blob:cue', DEFAULT_AUDIO_CUE_CONFIG);
    player.play();
    vi.advanceTimersByTime(3000);
    player.stop();

    expect(howl.play).toHaveBeenCalledWith('cue');
    expect(howl.stop).toHaveBeenCalledOnce();
  });

  it('is safe before prepare and unloads idempotently', () => {
    const player = new AudioCuePlayer(() => createHowl());

    expect(() => player.play()).not.toThrow();
    expect(() => player.stop()).not.toThrow();
    expect(() => player.unload()).not.toThrow();
  });
});
