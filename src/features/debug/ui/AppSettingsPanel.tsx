import {
  type AudioCueConfig,
  type AudioCuePlayer,
  AudioCueSection,
  type AudioFileStore,
  DEFAULT_AUDIO_CUE_CONFIG,
} from '@/features/audio';
import { DEFAULT_DICE_DESIGN } from '@/features/dice';
import { DEFAULT_SPIN_CONFIG } from '@/features/pose';
import type { DebugDesignState } from '../model/debugDesignState';

/** サイコロ形状、スピン、軸表示、効果音を編集する動作設定パネルの props。 */
export interface AppSettingsPanelProps {
  readonly value: DebugDesignState;
  readonly onChange: (next: DebugDesignState) => void;
  readonly audioCueConfig?: AudioCueConfig;
  readonly onAudioCueConfigChange?: (next: AudioCueConfig) => void;
  readonly audioFileStore?: AudioFileStore;
  readonly audioCuePlayer?: AudioCuePlayer;
  readonly className?: string;
}

/** アプリの動作設定を編集するフォームパネル。テーマ内容とは別に管理する。 */
export const AppSettingsPanel = ({
  value,
  onChange,
  audioCueConfig,
  onAudioCueConfigChange,
  audioFileStore,
  audioCuePlayer,
  className,
}: AppSettingsPanelProps): React.JSX.Element => {
  const handleRadius = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, radius: Number.parseFloat(e.target.value) });
  };
  const handleSize = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = Number.parseFloat(e.target.value);
    onChange({ ...value, size, radius: Math.min(value.radius, size / 2) });
  };
  const handleSpinNumber =
    (key: 'holdMs' | 'durationMs' | 'settleMs') => (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({
        ...value,
        spin: { ...value.spin, [key]: Number.parseInt(e.target.value, 10) },
      });
    };
  const handleSpinKeyframe =
    (index: number, key: 'at' | 'speed') => (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextKeyframes = value.spin.keyframes.map((frame, i) =>
        i === index ? { ...frame, [key]: Number.parseFloat(e.target.value) } : frame,
      );
      onChange({ ...value, spin: { ...value.spin, keyframes: nextKeyframes } });
    };
  const toggle = (key: 'showWorldAxes' | 'showLocalAxes' | 'showUpArrow') => () => {
    onChange({ ...value, [key]: !value[key] });
  };
  const handleReset = () => {
    onChange({
      ...value,
      radius: DEFAULT_DICE_DESIGN.radius,
      size: DEFAULT_DICE_DESIGN.size,
      spin: DEFAULT_SPIN_CONFIG,
      showWorldAxes: false,
      showLocalAxes: false,
      showUpArrow: false,
    });
    onAudioCueConfigChange?.(DEFAULT_AUDIO_CUE_CONFIG);
  };

  const rootClass = ['design-panel text-sm text-[#1a1a1a]', className].filter(Boolean).join(' ');
  const labelClass = 'design-panel__label';
  const rangeClass = 'design-panel__range';
  const inputClass = 'design-panel__input';
  const smallInputClass = 'design-panel__input design-panel__input--compact';

  return (
    <div className={rootClass}>
      <div className="design-panel__section">
        <div className="design-panel__heading">サイコロ設定</div>
        <label htmlFor="settings-radius" className={labelClass}>
          角丸 <span>{value.radius.toFixed(2)}</span>
        </label>
        <input
          id="settings-radius"
          type="range"
          min={0}
          max={value.size / 2}
          step={0.01}
          value={value.radius}
          onChange={handleRadius}
          className={rangeClass}
        />
        <label htmlFor="settings-size" className={labelClass}>
          サイズ <span>{value.size.toFixed(2)}</span>
        </label>
        <input
          id="settings-size"
          type="range"
          min={0.5}
          max={2.5}
          step={0.05}
          value={value.size}
          onChange={handleSize}
          className={rangeClass}
        />
      </div>

      <div className="design-panel__section">
        <div className="design-panel__heading">回転モーション</div>
        <div className="design-panel__triple">
          <label>
            <span>長押し ms</span>
            <input
              type="number"
              value={value.spin.holdMs}
              onChange={handleSpinNumber('holdMs')}
              aria-label="回転 長押し ms"
              min={100}
              max={2000}
              step={50}
              className={inputClass}
            />
          </label>
          <label>
            <span>回転 ms</span>
            <input
              type="number"
              value={value.spin.durationMs}
              onChange={handleSpinNumber('durationMs')}
              aria-label="回転 時間 ms"
              min={300}
              max={8000}
              step={100}
              className={inputClass}
            />
          </label>
          <label>
            <span>停止 ms</span>
            <input
              type="number"
              value={value.spin.settleMs}
              onChange={handleSpinNumber('settleMs')}
              aria-label="回転 停止 ms"
              min={100}
              max={3000}
              step={50}
              className={inputClass}
            />
          </label>
        </div>
        <div className="design-keyframe-head">
          <span>位置</span>
          <span>速度</span>
        </div>
        <div className="design-keyframes">
          {value.spin.keyframes.map((frame, index) => (
            <div key={`${frame.at}-${frame.speed}`} className="contents">
              <input
                type="number"
                value={frame.at}
                onChange={handleSpinKeyframe(index, 'at')}
                min={0}
                max={1}
                step={0.05}
                aria-label={`回転キーフレーム ${index + 1} 位置`}
                className={smallInputClass}
              />
              <input
                type="number"
                value={frame.speed}
                onChange={handleSpinKeyframe(index, 'speed')}
                min={0}
                max={60}
                step={1}
                aria-label={`回転キーフレーム ${index + 1} 速度`}
                className={smallInputClass}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="design-panel__section design-panel__toggles">
        <div className="design-panel__heading">軸表示</div>
        <label>
          <input
            type="checkbox"
            checked={value.showWorldAxes}
            onChange={toggle('showWorldAxes')}
            className="design-panel__checkbox"
          />
          ワールド軸
        </label>
        <label>
          <input
            type="checkbox"
            checked={value.showLocalAxes}
            onChange={toggle('showLocalAxes')}
            className="design-panel__checkbox"
          />
          ローカル軸
        </label>
        <label>
          <input
            type="checkbox"
            checked={value.showUpArrow}
            onChange={toggle('showUpArrow')}
            className="design-panel__checkbox"
          />
          上方向矢印
        </label>
      </div>

      {audioCueConfig && onAudioCueConfigChange && audioFileStore && audioCuePlayer ? (
        <AudioCueSection
          config={audioCueConfig}
          onConfigChange={onAudioCueConfigChange}
          audioFileStore={audioFileStore}
          audioCuePlayer={audioCuePlayer}
        />
      ) : null}

      <button type="button" onClick={handleReset} className="design-panel__delete">
        動作設定を初期化
      </button>
    </div>
  );
};
