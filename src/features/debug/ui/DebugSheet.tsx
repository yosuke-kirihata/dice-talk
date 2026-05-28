import { IoArrowBack } from 'react-icons/io5';
import type { AudioCueConfig, AudioCuePlayer, AudioFileStore } from '@/features/audio';
import type { PoseSource } from '@/shared/pose';
import type { DebugDesignState } from '../model/debugDesignState';
import { AppSettingsPanel } from './AppSettingsPanel';
import { DebugChartView } from './DebugChartView';
import { DesignPanel } from './DesignPanel';

type DebugSheetMode = 'design' | 'settings' | 'debug';

/** テーマ編集、動作設定、デバッグチャートを切り替えて表示するシートの props。 */
export interface DebugSheetProps {
  readonly poseSource: PoseSource;
  readonly design: DebugDesignState;
  readonly onDesignChange: (next: DebugDesignState) => void;
  readonly themeName?: string;
  readonly onThemeNameChange?: (next: string) => void;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly audioCueConfig?: AudioCueConfig;
  readonly onAudioCueConfigChange?: (next: AudioCueConfig) => void;
  readonly audioFileStore?: AudioFileStore;
  readonly audioCuePlayer?: AudioCuePlayer;
  readonly open: boolean;
  readonly onOpenChange: (next: boolean) => void;
  readonly mode?: DebugSheetMode;
  readonly mockSuffix?: string;
  readonly className?: string;
}

/** デバッグ系 UI を左側ドロワーとして表示するシートコンポーネント。 */
export const DebugSheet = ({
  poseSource,
  design,
  onDesignChange,
  themeName,
  onThemeNameChange,
  actionLabel,
  onAction,
  audioCueConfig,
  onAudioCueConfigChange,
  audioFileStore,
  audioCuePlayer,
  open,
  onOpenChange,
  mode = 'design',
  mockSuffix,
  className,
}: DebugSheetProps): React.JSX.Element => {
  const activeTitle =
    mode === 'design'
      ? 'テーマ編集'
      : mode === 'settings'
        ? '動作設定'
        : `デバッグ${mockSuffix ?? ''}`;
  const closeLabel =
    mode === 'design'
      ? 'テーマ編集を閉じる'
      : mode === 'settings'
        ? '動作設定を閉じる'
        : 'デバッグを閉じる';
  const chartActive = open && mode === 'debug';

  return (
    <div className={['settings-drawer', className].filter(Boolean).join(' ')} hidden={!open}>
      <button
        type="button"
        className="settings-drawer__scrim"
        aria-label={closeLabel}
        onClick={() => onOpenChange(false)}
      />

      <section
        id="settings-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label={activeTitle}
        className={['settings-drawer__panel pointer-events-auto', open ? 'is-open' : ''].join(' ')}
        hidden={!open}
      >
        <div className="settings-drawer__header">
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => onOpenChange(false)}
            className="settings-drawer__close"
          >
            <IoArrowBack aria-hidden />
          </button>
          <h2>{activeTitle}</h2>
          <span className="settings-drawer__header-spacer" aria-hidden />
        </div>

        <div className="settings-drawer__body">
          {mode === 'debug' ? (
            <DebugChartView poseSource={poseSource} active={chartActive} />
          ) : null}
          {mode === 'design' ? (
            <DesignPanel
              value={design}
              onChange={(next) => onDesignChange({ ...design, ...next })}
              {...(themeName !== undefined ? { themeName } : {})}
              {...(onThemeNameChange !== undefined ? { onThemeNameChange } : {})}
            />
          ) : null}
          {mode === 'settings' ? (
            <AppSettingsPanel
              value={design}
              onChange={onDesignChange}
              {...(audioCueConfig !== undefined ? { audioCueConfig } : {})}
              {...(onAudioCueConfigChange !== undefined ? { onAudioCueConfigChange } : {})}
              {...(audioFileStore !== undefined ? { audioFileStore } : {})}
              {...(audioCuePlayer !== undefined ? { audioCuePlayer } : {})}
            />
          ) : null}
        </div>
        {actionLabel && onAction ? (
          <div className="settings-drawer__footer">
            <button type="button" className="settings-drawer__primary" onClick={onAction}>
              {actionLabel}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
};
