import { Howl as HowlerHowl } from 'howler';
import { useMemo, useState } from 'react';
import { AudioCuePlayer, createAudioFileStore } from '@/features/audio';
import { isDebugMockEnabled, MockPoseSource } from '@/features/debug';
import { TouchPoseSource } from '@/features/pose';

/** アプリ全体で単一インスタンスとして扱う入力・音声・デバッグ用サービスを生成する。 */
export const useAppServices = () => {
  const [touchSource] = useState(() => new TouchPoseSource());
  const [audioFileStore] = useState(() => createAudioFileStore());
  const [audioCuePlayer] = useState(() => new AudioCuePlayer((opts) => new HowlerHowl(opts)));
  const debugMockEnabled = useMemo(() => isDebugMockEnabled(), []);
  const [debugMockSource] = useState<MockPoseSource | null>(() =>
    debugMockEnabled ? new MockPoseSource() : null,
  );

  return {
    touchSource,
    audioFileStore,
    audioCuePlayer,
    debugMockEnabled,
    debugMockSource,
  };
};
