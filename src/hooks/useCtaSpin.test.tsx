import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioCuePlayer } from '@/features/audio';
import { DEFAULT_SPIN_CONFIG, TouchPoseSource } from '@/features/pose';
import { useCtaSpin } from './useCtaSpin';

const CtaHarness = ({
  touchSource,
  audioCuePlayer,
  audioEnabled = true,
}: {
  readonly touchSource: TouchPoseSource;
  readonly audioCuePlayer: AudioCuePlayer;
  readonly audioEnabled?: boolean;
}) => {
  const { onCtaPointerDown, onCtaPointerMove, onCtaPointerUp } = useCtaSpin({
    touchSource,
    spinConfig: { ...DEFAULT_SPIN_CONFIG, holdMs: 100 },
    audioEnabled,
    audioCuePlayer,
  });
  return (
    <button
      type="button"
      onPointerDown={onCtaPointerDown}
      onPointerMove={onCtaPointerMove}
      onPointerUp={onCtaPointerUp}
    >
      roll
    </button>
  );
};

describe('useCtaSpin', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('starts spin and audio after a long press', async () => {
    const touchSource = new TouchPoseSource();
    const startSpin = vi.spyOn(touchSource, 'startSpin');
    const play = vi.fn();
    const audioCuePlayer = new AudioCuePlayer(() => ({ play, stop: vi.fn(), unload: vi.fn() }));
    vi.spyOn(audioCuePlayer, 'play').mockImplementation(play);
    render(<CtaHarness touchSource={touchSource} audioCuePlayer={audioCuePlayer} />);
    const button = screen.getByRole('button', { name: 'roll' });

    fireEvent.pointerDown(button, { pointerId: 1, clientX: 0, clientY: 0 });
    vi.advanceTimersByTime(150);
    fireEvent.pointerUp(button, { pointerId: 1, clientX: 0, clientY: 0 });

    expect(startSpin).toHaveBeenCalledOnce();
    expect(play).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('does not start when the press moves too far or has no matching pointer', async () => {
    const touchSource = new TouchPoseSource();
    const startSpin = vi.spyOn(touchSource, 'startSpin');
    const audioCuePlayer = new AudioCuePlayer(() => ({ play: vi.fn(), stop: vi.fn(), unload: vi.fn() }));
    render(<CtaHarness touchSource={touchSource} audioCuePlayer={audioCuePlayer} audioEnabled={false} />);
    const button = screen.getByRole('button', { name: 'roll' });

    fireEvent.pointerDown(button, { pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(button, { pointerId: 1, clientX: 20, clientY: 20 });
    vi.advanceTimersByTime(150);
    fireEvent.pointerUp(button, { pointerId: 1, clientX: 20, clientY: 20 });

    expect(startSpin).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('uses pointer capture when available and ignores short presses', () => {
    const setPointerCapture = vi.fn();
    const hasPointerCapture = vi.fn(() => true);
    const releasePointerCapture = vi.fn();
    HTMLElement.prototype.setPointerCapture = setPointerCapture;
    HTMLElement.prototype.hasPointerCapture = hasPointerCapture;
    HTMLElement.prototype.releasePointerCapture = releasePointerCapture;
    const touchSource = new TouchPoseSource();
    const startSpin = vi.spyOn(touchSource, 'startSpin');
    const audioCuePlayer = new AudioCuePlayer(() => ({
      play: vi.fn(),
      stop: vi.fn(),
      unload: vi.fn(),
    }));
    render(<CtaHarness touchSource={touchSource} audioCuePlayer={audioCuePlayer} />);
    const button = screen.getByRole('button', { name: 'roll' });

    fireEvent.pointerDown(button, { pointerId: 2, clientX: 0, clientY: 0 });
    vi.advanceTimersByTime(50);
    fireEvent.pointerUp(button, { pointerId: 2, clientX: 0, clientY: 0 });

    expect(setPointerCapture).toHaveBeenCalledWith(2);
    expect(releasePointerCapture).toHaveBeenCalledWith(2);
    expect(startSpin).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('ignores moves and releases before a matching press', () => {
    const touchSource = new TouchPoseSource();
    const startSpin = vi.spyOn(touchSource, 'startSpin');
    const audioCuePlayer = new AudioCuePlayer(() => ({
      play: vi.fn(),
      stop: vi.fn(),
      unload: vi.fn(),
    }));
    render(<CtaHarness touchSource={touchSource} audioCuePlayer={audioCuePlayer} />);
    const button = screen.getByRole('button', { name: 'roll' });

    fireEvent.pointerMove(button, { pointerId: 9, clientX: 10, clientY: 10 });
    fireEvent.pointerDown(button, { pointerId: 1, clientX: 0, clientY: 0 });
    vi.advanceTimersByTime(150);
    fireEvent.pointerUp(button, { pointerId: 2, clientX: 0, clientY: 0 });

    expect(startSpin).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
