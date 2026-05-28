import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_AUDIO_CUE_CONFIG } from '@/features/audio';
import { useAudioCuePersistence, useFaceDesignPersistence } from './useAppPersistence';

const FaceHarness = ({
  loaded,
  setLoaded,
}: {
  readonly loaded: boolean;
  readonly setLoaded: (loaded: boolean) => void;
}) => {
  useFaceDesignPersistence({
    customThemes: [],
    faceDesignLoaded: loaded,
    hydrateFaceDesign: vi.fn(),
    setFaceDesignLoaded: setLoaded,
  });
  return null;
};

const AudioHarness = ({
  loaded,
  sourceId,
  load,
  prepare,
}: {
  readonly loaded: boolean;
  readonly sourceId: string | null;
  readonly load: (id: string) => Promise<null | { url: string }>;
  readonly prepare: (url: string) => Promise<void>;
}) => {
  useAudioCuePersistence({
    audioCueConfig: { ...DEFAULT_AUDIO_CUE_CONFIG, sourceId },
    audioCueLoaded: loaded,
    audioFileStore: {
      save: vi.fn(),
      delete: vi.fn(),
      load: load as never,
    },
    audioCuePlayer: {
      prepare: prepare as never,
      play: vi.fn(),
      stop: vi.fn(),
      unload: vi.fn(),
    } as never,
    setAudioCueConfig: vi.fn(),
    setAudioCueLoaded: vi.fn(),
  });
  return null;
};

describe('app persistence hooks', () => {
  it('loads face design and saves once loaded', async () => {
    const setLoaded = vi.fn();
    render(<FaceHarness loaded setLoaded={setLoaded} />);
    await waitFor(() => expect(localStorage.getItem('dice-talk.customThemes.v1')).not.toBeNull());
  });

  it('loads and prepares saved audio only when a source exists', async () => {
    const load = vi.fn().mockResolvedValue({ url: 'blob:test' });
    const prepare = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <AudioHarness loaded sourceId={null} load={load} prepare={prepare} />,
    );
    expect(load).not.toHaveBeenCalled();

    rerender(<AudioHarness loaded sourceId="audio.cue.v1" load={load} prepare={prepare} />);
    await waitFor(() => expect(prepare).toHaveBeenCalledWith('blob:test', expect.any(Object)));
  });
});
