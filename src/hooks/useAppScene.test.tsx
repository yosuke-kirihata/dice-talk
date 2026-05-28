import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AudioCuePlayer } from '@/features/audio';
import { DEFAULT_APP_DESIGN } from '@/types/appDesignState';
import { TouchPoseSource } from '@/features/pose';
import { playAudioCue, useAppPoseSources, useDebugMockSource, useSceneOptions } from './useAppScene';

const HookHarness = ({ mockSource }: { readonly mockSource: TouchPoseSource | null }) => {
  useDebugMockSource(mockSource as Parameters<typeof useDebugMockSource>[0]);
  const options = useSceneOptions({ ...DEFAULT_APP_DESIGN, showWorldAxes: true });
  const sources = useAppPoseSources(
    new TouchPoseSource(),
    mockSource as Parameters<typeof useAppPoseSources>[1],
  );
  return <div data-size={options.diceGeometryOptions.size} data-source={sources.debugSource.id} />;
};

describe('useAppScene', () => {
  it('starts and stops debug mock sources and selects debug source', () => {
    const mockSource = new TouchPoseSource();
    Object.defineProperty(mockSource, 'id', { value: 'mock' });
    const start = vi.spyOn(mockSource, 'start');
    const stop = vi.spyOn(mockSource, 'stop');
    const { container, unmount } = render(<HookHarness mockSource={mockSource} />);

    expect(container.firstElementChild).toHaveAttribute('data-source', 'mock');
    expect(start).toHaveBeenCalledOnce();
    unmount();
    expect(stop).toHaveBeenCalledOnce();
  });

  it('falls back to touch source and gates audio playback', () => {
    const { container } = render(<HookHarness mockSource={null} />);
    expect(container.firstElementChild).toHaveAttribute('data-source', 'touch');

    const player = new AudioCuePlayer(() => ({ play: vi.fn(), stop: vi.fn(), unload: vi.fn() }));
    const play = vi.spyOn(player, 'play');
    playAudioCue(false, player);
    playAudioCue(true, player);
    expect(play).toHaveBeenCalledOnce();
  });
});
