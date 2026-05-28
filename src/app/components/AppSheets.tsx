import type { AudioCueConfig, AudioCuePlayer, AudioFileStore } from '@/features/audio';
import { DebugSheet } from '@/features/debug';
import type { CustomTheme } from '@/features/dice';
import type { PoseSource } from '@/features/pose';
import type { AppDesignState } from '@/types/appDesignState';

interface AppSheetsProps {
  readonly poseSource: PoseSource;
  readonly design: AppDesignState;
  readonly draftCustomTheme: CustomTheme | null;
  readonly customThemes: readonly CustomTheme[];
  readonly activeCustomTheme: CustomTheme | undefined;
  readonly themeEditorOpen: boolean;
  readonly appSettingsOpen: boolean;
  readonly debugOpen: boolean;
  readonly debugMockEnabled: boolean;
  readonly audioCueConfig: AudioCueConfig;
  readonly audioFileStore: AudioFileStore;
  readonly audioCuePlayer: AudioCuePlayer;
  readonly onDesignChange: (next: AppDesignState) => void;
  readonly onThemeNameChange: (nextName: string) => void;
  readonly onCloseThemeEditor: (open: boolean) => void;
  readonly onConfirmCustomTheme: () => void;
  readonly onAppSettingsChange: (next: AppDesignState) => void;
  readonly onAudioCueConfigChange: (next: AudioCueConfig) => void;
  readonly onAppSettingsOpenChange: (open: boolean) => void;
  readonly onDebugOpenChange: (open: boolean) => void;
}

const SHEET_CLASS =
  'absolute left-0 top-[max(env(safe-area-inset-top),0.75rem)] bottom-[max(env(safe-area-inset-bottom),0.75rem)] z-20';

/** テーマ編集、動作設定、デバッグシートを app 状態に接続してまとめて描画する。 */
export const AppSheets = ({
  poseSource,
  design,
  draftCustomTheme,
  customThemes,
  activeCustomTheme,
  themeEditorOpen,
  appSettingsOpen,
  debugOpen,
  debugMockEnabled,
  audioCueConfig,
  audioFileStore,
  audioCuePlayer,
  onDesignChange,
  onThemeNameChange,
  onCloseThemeEditor,
  onConfirmCustomTheme,
  onAppSettingsChange,
  onAudioCueConfigChange,
  onAppSettingsOpenChange,
  onDebugOpenChange,
}: AppSheetsProps): React.JSX.Element => {
  const isEditingExisting =
    draftCustomTheme !== null && customThemes.some((theme) => theme.id === draftCustomTheme.id);
  const themeActionLabel = isEditingExisting ? '編集を確定' : 'テーマを作成';
  return (
    <>
      <DebugSheet
        poseSource={poseSource}
        design={design}
        onDesignChange={onDesignChange}
        {...(draftCustomTheme
          ? { themeName: draftCustomTheme.name }
          : activeCustomTheme
            ? { themeName: activeCustomTheme.name }
            : {})}
        onThemeNameChange={onThemeNameChange}
        open={themeEditorOpen}
        onOpenChange={onCloseThemeEditor}
        mode="design"
        {...(draftCustomTheme
          ? { actionLabel: themeActionLabel, onAction: onConfirmCustomTheme }
          : {})}
        className={SHEET_CLASS}
      />
      <DebugSheet
        poseSource={poseSource}
        design={design}
        onDesignChange={onAppSettingsChange}
        audioCueConfig={audioCueConfig}
        onAudioCueConfigChange={onAudioCueConfigChange}
        audioFileStore={audioFileStore}
        audioCuePlayer={audioCuePlayer}
        open={appSettingsOpen}
        onOpenChange={onAppSettingsOpenChange}
        mode="settings"
        className={SHEET_CLASS}
      />
      <DebugSheet
        poseSource={poseSource}
        design={design}
        onDesignChange={onDesignChange}
        open={debugOpen}
        onOpenChange={onDebugOpenChange}
        mode="debug"
        mockSuffix={debugMockEnabled ? ' (mock)' : ''}
        className={SHEET_CLASS}
      />
    </>
  );
};
