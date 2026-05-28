import { useCallback, useRef } from 'react';
import type { AudioCuePlayer } from '@/features/audio';
import type { SpinMotionConfig, TouchPoseSource } from '@/features/pose';
import { playAudioCue } from './useAppScene';

const CTA_LONG_PRESS_MOVE_TOLERANCE_PX = 8;

interface CtaPress {
  readonly pointerId: number;
  readonly startedAt: number;
  readonly startX: number;
  readonly startY: number;
  readonly movedPx: number;
}

interface CtaSpinHandlers {
  readonly onCtaPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  readonly onCtaPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
  readonly onCtaPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void;
}

interface CtaSpinOptions {
  readonly touchSource: TouchPoseSource;
  readonly spinConfig: SpinMotionConfig;
  readonly audioEnabled: boolean;
  readonly audioCuePlayer: AudioCuePlayer;
}

/** CTA ボタンの長押し操作をスピン開始と効果音再生に変換する。 */
export const useCtaSpin = ({
  touchSource,
  spinConfig,
  audioEnabled,
  audioCuePlayer,
}: CtaSpinOptions): CtaSpinHandlers => {
  const ctaPressRef = useRef<CtaPress | null>(null);

  const startSpin = useCallback(() => {
    touchSource.startSpin(spinConfig);
    playAudioCue(audioEnabled, audioCuePlayer);
  }, [touchSource, spinConfig, audioEnabled, audioCuePlayer]);

  const onCtaPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (typeof e.currentTarget.setPointerCapture === 'function') {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    ctaPressRef.current = {
      pointerId: e.pointerId,
      startedAt: Date.now(),
      startX: e.clientX,
      startY: e.clientY,
      movedPx: 0,
    };
  };

  const onCtaPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const press = ctaPressRef.current;
    if (!press || press.pointerId !== e.pointerId) return;
    ctaPressRef.current = {
      ...press,
      movedPx: Math.max(
        press.movedPx,
        Math.hypot(e.clientX - press.startX, e.clientY - press.startY),
      ),
    };
  };

  const onCtaPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (
      typeof e.currentTarget.hasPointerCapture === 'function' &&
      e.currentTarget.hasPointerCapture(e.pointerId) &&
      typeof e.currentTarget.releasePointerCapture === 'function'
    ) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const press = ctaPressRef.current;
    if (press?.pointerId !== e.pointerId) return;
    const heldMs = Date.now() - press.startedAt;
    if (heldMs >= spinConfig.holdMs && press.movedPx <= CTA_LONG_PRESS_MOVE_TOLERANCE_PX) {
      startSpin();
    }
    ctaPressRef.current = null;
  };

  return { onCtaPointerDown, onCtaPointerMove, onCtaPointerUp };
};
