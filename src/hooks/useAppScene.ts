import { useEffect, useMemo } from 'react';
import type { AudioCuePlayer } from '@/features/audio';
import type { MockPoseSource } from '@/features/debug';
import { faceColorMapToFaceColors } from '@/features/dice';
import type { PoseSource, TouchPoseSource } from '@/features/pose';
import type { AppDesignState } from '@/types/appDesignState';

/** デバッグ用 mock pose source が有効な間だけ開始し、unmount 時に停止する。 */
export const useDebugMockSource = (debugMockSource: MockPoseSource | null): void => {
  useEffect(() => {
    if (!debugMockSource) return undefined;
    void debugMockSource.start();
    return () => {
      void debugMockSource.stop();
    };
  }, [debugMockSource]);
};

/** アプリ設定から DiceCanvas に渡すシーン描画オプションを組み立てる。 */
export const useSceneOptions = (design: AppDesignState) =>
  useMemo(
    () => ({
      debug: {
        worldAxes: design.showWorldAxes,
        localAxes: design.showLocalAxes,
        upArrow: design.showUpArrow,
      },
      diceGeometryOptions: {
        size: design.size,
        radius: design.radius,
        faceTexts: design.faceTexts,
        faceColors: faceColorMapToFaceColors(design.faceColors),
      },
    }),
    [
      design.size,
      design.radius,
      design.faceTexts,
      design.faceColors,
      design.showWorldAxes,
      design.showLocalAxes,
      design.showUpArrow,
    ],
  );

interface AppPoseSources {
  readonly poseSource: PoseSource;
  readonly debugSource: PoseSource;
}

/** 通常のタッチ入力 source と、デバッグ表示用 source を選択して返す。 */
export const useAppPoseSources = (
  touchSource: TouchPoseSource,
  debugMockSource: MockPoseSource | null,
): AppPoseSources => {
  const poseSource: PoseSource = touchSource;
  const debugSource: PoseSource = debugMockSource ?? poseSource;
  return { poseSource, debugSource };
};

/** 効果音が有効な場合だけ、現在準備されているキュー音を再生する。 */
export const playAudioCue = (enabled: boolean, audioCuePlayer: AudioCuePlayer): void => {
  if (enabled) audioCuePlayer.play();
};
