import { useEffect } from 'react';
import type { AudioCueConfig, AudioCuePlayer, AudioFileStore } from '@/features/audio';
import { loadAudioCueConfig, saveAudioCueConfig } from '@/features/audio';
import {
  type CustomTheme,
  type FaceColorMap,
  type FaceTextMap,
  loadCustomThemes,
  loadFaceColors,
  loadFaceTexts,
  saveCustomThemes,
} from '@/features/dice';

interface FaceDesignPersistenceOptions {
  readonly customThemes: readonly CustomTheme[];
  readonly faceDesignLoaded: boolean;
  readonly hydrateFaceDesign: (
    customThemes: readonly CustomTheme[] | null,
    faceTexts: FaceTextMap | null,
    faceColors: FaceColorMap | null,
  ) => void;
  readonly setFaceDesignLoaded: (loaded: boolean) => void;
}

/** カスタムテーマと旧形式の面テキスト / 面色設定を読み込み、変更後のテーマ一覧を保存する。 */
export const useFaceDesignPersistence = ({
  customThemes,
  faceDesignLoaded,
  hydrateFaceDesign,
  setFaceDesignLoaded,
}: FaceDesignPersistenceOptions): void => {
  useEffect(() => {
    let cancelled = false;
    void Promise.all([loadCustomThemes(), loadFaceTexts(), loadFaceColors()])
      .then(([storedCustomThemes, faceTexts, faceColors]) => {
        if (!cancelled) hydrateFaceDesign(storedCustomThemes, faceTexts, faceColors);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setFaceDesignLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrateFaceDesign, setFaceDesignLoaded]);

  useEffect(() => {
    if (!faceDesignLoaded) return;
    void saveCustomThemes(customThemes).catch(() => undefined);
  }, [faceDesignLoaded, customThemes]);
};

interface AudioCuePersistenceOptions {
  readonly audioCueConfig: AudioCueConfig;
  readonly audioCueLoaded: boolean;
  readonly audioFileStore: AudioFileStore;
  readonly audioCuePlayer: AudioCuePlayer;
  readonly setAudioCueConfig: (config: AudioCueConfig) => void;
  readonly setAudioCueLoaded: (loaded: boolean) => void;
}

/** 効果音設定を永続化し、選択済み音声ファイルをプレイヤーへ準備する。 */
export const useAudioCuePersistence = ({
  audioCueConfig,
  audioCueLoaded,
  audioFileStore,
  audioCuePlayer,
  setAudioCueConfig,
  setAudioCueLoaded,
}: AudioCuePersistenceOptions): void => {
  useEffect(() => {
    let cancelled = false;
    void loadAudioCueConfig()
      .then((stored) => {
        if (!cancelled && stored) setAudioCueConfig(stored);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setAudioCueLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [setAudioCueConfig, setAudioCueLoaded]);

  useEffect(() => {
    if (!audioCueLoaded) return;
    void saveAudioCueConfig(audioCueConfig).catch(() => undefined);
    if (!audioCueConfig.sourceId) return;
    void audioFileStore
      .load(audioCueConfig.sourceId)
      .then((saved) => {
        if (saved) return audioCuePlayer.prepare(saved.url, audioCueConfig);
        return undefined;
      })
      .catch(() => undefined);
  }, [audioCueLoaded, audioCueConfig, audioFileStore, audioCuePlayer]);

  useEffect(() => () => audioCuePlayer.unload(), [audioCuePlayer]);
};
