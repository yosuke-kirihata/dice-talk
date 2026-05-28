import {
  CUSTOM_THEME_FACE_TEXT_MAX_LENGTH,
  CUSTOM_THEME_NAME_MAX_LENGTH,
  DEFAULT_DICE_DESIGN,
  type DiceDesignState,
  DICE_FACE_DEFINITIONS,
  type DicePip,
} from '@/features/dice';
import { HEX_COLOR } from '@/shared/validation';

const FACE_TEXT_ROWS = [...DICE_FACE_DEFINITIONS].sort((a, b) => a.pip - b.pip);

/** カスタムテーマの名前、面テキスト、面色を編集するパネルの props。 */
export interface DesignPanelProps {
  readonly value: DiceDesignState;
  readonly onChange: (next: DiceDesignState) => void;
  readonly themeName?: string;
  readonly onThemeNameChange?: (next: string) => void;
  readonly className?: string;
}

/** サイコロ面テーマの内容を編集するフォームパネル。 */
export const DesignPanel = ({
  value,
  onChange,
  themeName = 'マイテーマ',
  onThemeNameChange,
  className,
}: DesignPanelProps): React.JSX.Element => {
  const handleThemeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    onThemeNameChange?.(e.target.value.slice(0, CUSTOM_THEME_NAME_MAX_LENGTH));
  };
  const handleFaceText = (pip: DicePip) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...value,
      faceTexts: { ...value.faceTexts, [pip]: e.target.value },
    });
  };
  const handleFaceColor = (pip: DicePip) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    if (!HEX_COLOR.test(color)) return;
    onChange({
      ...value,
      faceColors: { ...value.faceColors, [pip]: color.toLowerCase() },
    });
  };
  const handleReset = () => {
    onChange({
      ...value,
      faceTexts: DEFAULT_DICE_DESIGN.faceTexts,
      faceColors: DEFAULT_DICE_DESIGN.faceColors,
    });
  };

  const rootClass = ['design-panel text-sm text-[#1a1a1a]', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <div className="theme-summary">
        <div className="theme-summary__thumb" aria-hidden>
          <span />
        </div>
        <div className="theme-summary__text">
          <label className="theme-summary__name" htmlFor="theme-name-input">
            テーマ名
          </label>
          <input
            id="theme-name-input"
            type="text"
            value={themeName}
            onChange={handleThemeName}
            onBlur={(e) => onThemeNameChange?.(e.target.value.trim() || themeName)}
            aria-label="テーマ名"
            maxLength={CUSTOM_THEME_NAME_MAX_LENGTH}
            className="theme-summary__input"
          />
        </div>
      </div>

      <div className="design-panel__section">
        <div className="design-panel__heading">サイコロの内容</div>
        <div className="design-face-list">
          {FACE_TEXT_ROWS.map((face) => (
            <label key={face.pip} className="design-face-row">
              <span className={`face-badge face-badge--${face.pip}`}>{face.pip}</span>
              <textarea
                value={value.faceTexts[face.pip]}
                onChange={handleFaceText(face.pip)}
                aria-label={`面 ${face.pip} テキスト`}
                rows={2}
                maxLength={CUSTOM_THEME_FACE_TEXT_MAX_LENGTH}
                className="design-face-row__text"
              />
            </label>
          ))}
        </div>
      </div>
      <div className="design-panel__section">
        <div className="design-panel__heading">面の色</div>
        <div className="design-color-list">
          {FACE_TEXT_ROWS.map((face) => (
            <div key={face.pip} className="design-color-row">
              <span className={`face-badge face-badge--${face.pip}`}>{face.pip}</span>
              <input
                type="color"
                value={value.faceColors[face.pip]}
                onChange={handleFaceColor(face.pip)}
                aria-label={`面 ${face.pip} 色選択`}
                className="design-color-row__picker"
              />
              <input
                type="text"
                value={value.faceColors[face.pip]}
                onChange={handleFaceColor(face.pip)}
                aria-label={`面 ${face.pip} 色コード`}
                inputMode="text"
                maxLength={7}
                className="design-color-row__hex"
              />
            </div>
          ))}
        </div>
      </div>
      <button type="button" onClick={handleReset} className="design-panel__delete">
        初期化
      </button>
    </div>
  );
};
