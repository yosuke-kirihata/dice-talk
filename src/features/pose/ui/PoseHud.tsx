import { useEffect, useState } from 'react';
import { toYawPitchRoll, type YawPitchRoll } from '@/features/pose/lib/quaternion';
import type { PoseSource } from '@/shared/pose';

/** デバッグ用の姿勢数値表示 props。 */
export interface PoseHudProps {
  readonly poseSource: PoseSource;
  readonly className?: string;
}

const UPDATE_INTERVAL_MS = 50;

/** PoseSource から現在姿勢を読み取り、ヨー・ピッチ・ロールをライブ表示する。 */
export const PoseHud = ({ poseSource, className }: PoseHudProps): React.JSX.Element => {
  const [angles, setAngles] = useState<YawPitchRoll>(() =>
    toYawPitchRoll(poseSource.getCurrentPose().quat),
  );

  useEffect(() => {
    let raf = 0;
    let lastUpdate = 0;
    const tick = (t: number) => {
      if (t - lastUpdate >= UPDATE_INTERVAL_MS) {
        setAngles(toYawPitchRoll(poseSource.getCurrentPose().quat));
        lastUpdate = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [poseSource]);

  const root = [
    'min-w-[160px] rounded-lg p-3 text-xs text-zinc-100',
    'bg-zinc-900/75 backdrop-blur-sm shadow-lg font-mono',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={root}>
      <div className="font-semibold tracking-wide mb-1.5 font-sans">Pose</div>
      <div className="flex justify-between" data-testid="pose-hud-yaw">
        <span>Yaw</span>
        <span>{angles.yaw.toFixed(1)}°</span>
      </div>
      <div className="flex justify-between" data-testid="pose-hud-pitch">
        <span>Pitch</span>
        <span>{angles.pitch.toFixed(1)}°</span>
      </div>
      <div className="flex justify-between" data-testid="pose-hud-roll">
        <span>Roll</span>
        <span>{angles.roll.toFixed(1)}°</span>
      </div>
    </div>
  );
};
