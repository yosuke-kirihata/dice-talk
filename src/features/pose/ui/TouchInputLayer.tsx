import { useCallback, useRef } from 'react';
import { DEFAULT_SPIN_CONFIG, type SpinMotionConfig } from '@/features/pose/sources/spinMotion';
import type { TouchPoseSource } from '@/features/pose/sources/touchPoseSource';

/** タッチ回転と長押しスピンを受け取る透明ポインターレイヤーの props。 */
export interface TouchInputLayerProps {
  readonly source: TouchPoseSource;
  readonly spinConfig?: SpinMotionConfig;
  readonly onSpinStart?: () => void;
  readonly className?: string;
}

interface DragState {
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
  readonly startedAt: number;
  readonly lastX: number;
  readonly lastY: number;
  readonly movedPx: number;
}

const LONG_PRESS_MOVE_TOLERANCE_PX = 8;

/** サイコロの手動回転と自動スピン開始を担うポインター入力レイヤー。 */
export const TouchInputLayer = ({
  source,
  spinConfig = DEFAULT_SPIN_CONFIG,
  onSpinStart,
  className,
}: TouchInputLayerProps): React.JSX.Element => {
  const dragRef = useRef<DragState | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (typeof e.currentTarget.setPointerCapture === 'function') {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startedAt: Date.now(),
      lastX: e.clientX,
      lastY: e.clientY,
      movedPx: 0,
    };
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const dx = e.clientX - drag.lastX;
      const dy = e.clientY - drag.lastY;
      dragRef.current = {
        ...drag,
        lastX: e.clientX,
        lastY: e.clientY,
        movedPx: Math.max(
          drag.movedPx,
          Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY),
        ),
      };
      source.applyDelta(dx, dy);
    },
    [source],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (
        typeof e.currentTarget.hasPointerCapture === 'function' &&
        e.currentTarget.hasPointerCapture(e.pointerId) &&
        typeof e.currentTarget.releasePointerCapture === 'function'
      ) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      const drag = dragRef.current;
      if (drag?.pointerId === e.pointerId) {
        const heldMs = Date.now() - drag.startedAt;
        if (heldMs >= spinConfig.holdMs && drag.movedPx <= LONG_PRESS_MOVE_TOLERANCE_PX) {
          source.startSpin(spinConfig);
          onSpinStart?.();
        }
        dragRef.current = null;
      }
    },
    [source, spinConfig, onSpinStart],
  );

  return (
    <div
      data-testid="touch-input-layer"
      className={className ?? 'touch-input-layer'}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  );
};
