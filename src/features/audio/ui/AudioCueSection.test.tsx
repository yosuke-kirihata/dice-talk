import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type AudioCueConfig, DEFAULT_AUDIO_CUE_CONFIG } from '../model/audioCueConfig';
import type { AudioCuePlayer } from '../player/audioCuePlayer';
import type { AudioFileStore, SavedAudio } from '../storage/webAudioFileStore';
import { AudioCueSection } from './AudioCueSection';

const savedAudio: SavedAudio = {
  id: 'audio.cue.v1',
  url: 'blob:cue',
  mimeType: 'audio/mpeg',
  name: 'cue.mp3',
  sizeBytes: 1024,
};

const renderSection = (
  config: AudioCueConfig = DEFAULT_AUDIO_CUE_CONFIG,
  audioFileStoreOverride: Partial<AudioFileStore> = {},
) => {
  const onConfigChange = vi.fn<(next: AudioCueConfig) => void>();
  const audioFileStore: AudioFileStore = {
    save: vi.fn(async () => savedAudio),
    load: vi.fn(async () => null),
    delete: vi.fn(),
    ...audioFileStoreOverride,
  };
  const audioCuePlayer = {
    prepare: vi.fn(async () => undefined),
    play: vi.fn(),
    stop: vi.fn(),
    unload: vi.fn(),
  } as unknown as AudioCuePlayer;
  render(
    <AudioCueSection
      config={config}
      onConfigChange={onConfigChange}
      audioFileStore={audioFileStore}
      audioCuePlayer={audioCuePlayer}
    />,
  );
  return { onConfigChange, audioFileStore, audioCuePlayer };
};

describe('AudioCueSection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders audio file input and config controls', () => {
    renderSection();
    expect(screen.getByLabelText(/音声ファイル/)).toHaveAttribute(
      'accept',
      expect.stringContaining('.mp3'),
    );
    expect(screen.getByLabelText(/効果音 有効/)).toBeInTheDocument();
    expect(screen.getByLabelText(/音声 開始位置/)).toBeInTheDocument();
    expect(screen.getByLabelText(/音声 終了位置/)).toBeInTheDocument();
    expect(screen.getByLabelText(/音声音量/)).toBeInTheDocument();
  });

  it('saves a selected file and enables the cue source', async () => {
    const { onConfigChange, audioFileStore, audioCuePlayer } = renderSection();
    const file = new File(['abc'], 'cue.mp3', { type: 'audio/mpeg' });

    fireEvent.change(screen.getByLabelText(/音声ファイル/), { target: { files: [file] } });

    await screen.findByText('cue.mp3');
    expect(audioFileStore.save).toHaveBeenCalledWith(file);
    expect(audioCuePlayer.prepare).toHaveBeenCalledWith('blob:cue', {
      ...DEFAULT_AUDIO_CUE_CONFIG,
      sourceId: savedAudio.id,
    });
    expect(onConfigChange).toHaveBeenCalledWith({
      ...DEFAULT_AUDIO_CUE_CONFIG,
      sourceId: savedAudio.id,
    });
  });

  it('restores saved audio metadata when reopening an existing cue', async () => {
    const load = vi.fn(async () => savedAudio);
    renderSection({ ...DEFAULT_AUDIO_CUE_CONFIG, sourceId: savedAudio.id }, { load });

    expect(await screen.findByText('cue.mp3')).toBeInTheDocument();
    expect(screen.getByText('1 KB')).toBeInTheDocument();
    expect(load).toHaveBeenCalledWith(savedAudio.id);
  });

  it('shows an error without saving files over 20MB', async () => {
    const { audioFileStore } = renderSection();
    const file = new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'big.wav');

    fireEvent.change(screen.getByLabelText(/音声ファイル/), { target: { files: [file] } });

    expect(await screen.findByText(/20MB/i)).toBeInTheDocument();
    expect(audioFileStore.save).not.toHaveBeenCalled();
  });

  it('shows an error when saving the selected file fails', async () => {
    const { onConfigChange, audioFileStore, audioCuePlayer } = renderSection();
    vi.mocked(audioFileStore.save).mockRejectedValue(new Error('storage failed'));
    const file = new File(['abc'], 'cue.mp3', { type: 'audio/mpeg' });

    fireEvent.change(screen.getByLabelText(/音声ファイル/), { target: { files: [file] } });

    expect(await screen.findByText(/音声ファイルを保存できませんでした/)).toBeInTheDocument();
    expect(audioCuePlayer.prepare).not.toHaveBeenCalled();
    expect(onConfigChange).not.toHaveBeenCalled();
  });

  it('commits minute:second start time on blur', () => {
    const { onConfigChange } = renderSection({ ...DEFAULT_AUDIO_CUE_CONFIG, sourceId: 'cue' });
    const startInput = screen.getByLabelText(/音声 開始位置/);

    fireEvent.change(startInput, { target: { value: '1:30' } });
    expect(onConfigChange).not.toHaveBeenCalled();

    fireEvent.blur(startInput);
    expect(onConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({ sourceId: 'cue', startSec: 90 }),
    );
  });

  it('accepts plain seconds with a decimal in the start input', () => {
    const { onConfigChange } = renderSection({ ...DEFAULT_AUDIO_CUE_CONFIG, sourceId: 'cue' });
    const startInput = screen.getByLabelText(/音声 開始位置/);

    fireEvent.change(startInput, { target: { value: '1.5' } });
    fireEvent.blur(startInput);

    expect(onConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({ sourceId: 'cue', startSec: 1.5 }),
    );
  });

  it('reverts invalid time input back to the previous value on blur', () => {
    const { onConfigChange } = renderSection({
      ...DEFAULT_AUDIO_CUE_CONFIG,
      sourceId: 'cue',
      startSec: 2,
    });
    const startInput = screen.getByLabelText(/音声 開始位置/) as HTMLInputElement;

    fireEvent.change(startInput, { target: { value: '1:99' } });
    fireEvent.blur(startInput);

    expect(onConfigChange).not.toHaveBeenCalled();
    expect(startInput.value).toBe('0:02');
  });

  it('toggles the enabled flag through onConfigChange', () => {
    const { onConfigChange } = renderSection({ ...DEFAULT_AUDIO_CUE_CONFIG, sourceId: 'cue' });

    fireEvent.click(screen.getByLabelText(/効果音 有効/));
    expect(onConfigChange).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
  });

  it('previews the prepared cue', () => {
    const { audioCuePlayer } = renderSection({ ...DEFAULT_AUDIO_CUE_CONFIG, sourceId: 'cue' });
    fireEvent.click(screen.getByRole('button', { name: /試聴/ }));
    expect(audioCuePlayer.play).toHaveBeenCalledOnce();
  });

  it('disables preview until an audio source is configured', () => {
    renderSection();
    expect(screen.getByRole('button', { name: /試聴/ })).toBeDisabled();
  });

  it('deletes the configured cue, disables audio, and resets the time range', async () => {
    const { onConfigChange, audioFileStore, audioCuePlayer } = renderSection({
      ...DEFAULT_AUDIO_CUE_CONFIG,
      enabled: true,
      sourceId: 'audio.cue.v1',
      startSec: 1.5,
      endSec: 4,
    });

    fireEvent.click(screen.getByRole('button', { name: /削除/ }));

    expect(audioFileStore.delete).toHaveBeenCalledWith('audio.cue.v1');
    await waitFor(() => {
      expect(audioCuePlayer.unload).toHaveBeenCalledOnce();
      expect(onConfigChange).toHaveBeenCalledWith({
        ...DEFAULT_AUDIO_CUE_CONFIG,
        sourceId: null,
        enabled: false,
        startSec: 0,
        endSec: 0,
      });
    });
  });

  it('disables delete until an audio source is configured', () => {
    renderSection();
    expect(screen.getByRole('button', { name: /削除/ })).toBeDisabled();
  });
});
