import {
  IoAdd,
  IoArrowBack,
  IoBulbOutline,
  IoCreateOutline,
  IoTrashOutline,
} from 'react-icons/io5';
import {
  type ActiveThemeId,
  type CustomTheme,
  customThemeActiveId,
  THEME_PRESETS,
  type ThemePreset,
  type ThemeTab,
} from '@/features/dice';

interface ThemeSelectDialogProps {
  readonly open: boolean;
  readonly themeTab: ThemeTab;
  readonly customThemes: readonly CustomTheme[];
  readonly activeThemeId: ActiveThemeId;
  readonly onClose: () => void;
  readonly onThemeTabChange: (tab: ThemeTab) => void;
  readonly onSelectTheme: (theme: ThemePreset) => void;
  readonly onSelectCustomTheme: (theme: CustomTheme) => void;
  readonly onEditCustomTheme: (theme: CustomTheme) => void;
  readonly onDeleteCustomTheme: (theme: CustomTheme) => void;
  readonly onCreateCustomTheme: () => void;
}

/** マイテーマとプリセットテーマを選択・作成・編集・削除するダイアログ。 */
export const ThemeSelectDialog = ({
  open,
  themeTab,
  customThemes,
  activeThemeId,
  onClose,
  onThemeTabChange,
  onSelectTheme,
  onSelectCustomTheme,
  onEditCustomTheme,
  onDeleteCustomTheme,
  onCreateCustomTheme,
}: ThemeSelectDialogProps): React.JSX.Element | null => {
  if (!open) return null;

  const renderPresetCard = (theme: ThemePreset) => {
    const selected = theme.id === activeThemeId;
    return (
      <article key={theme.id} className={['theme-card', selected ? 'is-selected' : ''].join(' ')}>
        <button
          type="button"
          className="theme-card__select"
          aria-label={`${theme.name}を選択`}
          aria-pressed={selected}
          onClick={() => onSelectTheme(theme)}
        >
          <span className={['theme-card__dice', theme.swatchClass].join(' ')}>
            <span aria-hidden />
          </span>
          <strong>{theme.name}</strong>
        </button>
      </article>
    );
  };

  return (
    <div
      className="theme-select-screen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-select-title"
    >
      <button
        type="button"
        className="theme-select-screen__backdrop"
        aria-label="テーマ選択を閉じる"
        onClick={onClose}
      />
      <section className="theme-select-panel">
        <header className="theme-select-panel__header">
          <button
            type="button"
            className="theme-select-panel__close"
            aria-label="テーマ選択を閉じる"
            onClick={onClose}
          >
            <IoArrowBack aria-hidden />
          </button>
          <h2 id="theme-select-title">テーマ設定</h2>
          <span className="theme-select-panel__header-spacer" aria-hidden />
        </header>

        <div className="theme-select-panel__tabs" role="tablist" aria-label="テーマ種別">
          <button
            type="button"
            role="tab"
            aria-selected={themeTab === 'my'}
            onClick={() => onThemeTabChange('my')}
          >
            マイテーマ
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={themeTab === 'preset'}
            onClick={() => onThemeTabChange('preset')}
          >
            プリセット
          </button>
        </div>

        <section className="theme-select-grid" aria-labelledby="theme-list-title">
          <h3 id="theme-list-title" className="theme-select-section-title">
            テーマ一覧
          </h3>
          {themeTab === 'my' ? (
            <>
              {customThemes.map((theme) => {
                const selected = activeThemeId === customThemeActiveId(theme.id);
                return (
                  <article
                    key={theme.id}
                    className={['theme-card', selected ? 'is-selected' : ''].join(' ')}
                  >
                    <button
                      type="button"
                      className="theme-card__more"
                      aria-label={`${theme.name}を編集`}
                      onClick={() => onEditCustomTheme(theme)}
                    >
                      <IoCreateOutline aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="theme-card__delete"
                      aria-label={`${theme.name}を削除`}
                      onClick={() => onDeleteCustomTheme(theme)}
                    >
                      <IoTrashOutline aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="theme-card__select"
                      aria-label={`${theme.name}を選択`}
                      aria-pressed={selected}
                      onClick={() => onSelectCustomTheme(theme)}
                    >
                      <span className="theme-card__dice theme-card__dice--my">
                        <span aria-hidden />
                      </span>
                      <strong>{theme.name}</strong>
                    </button>
                  </article>
                );
              })}
              <article className="theme-card theme-card--create">
                <button type="button" className="theme-card__select" onClick={onCreateCustomTheme}>
                  <span className="theme-card__create-icon" aria-hidden>
                    <IoAdd />
                  </span>
                  <strong>新しいテーマを作る</strong>
                </button>
              </article>
            </>
          ) : (
            THEME_PRESETS.map(renderPresetCard)
          )}
        </section>

        <aside className="theme-select-note">
          <IoBulbOutline aria-hidden />
          <div>
            <strong>テーマを使い分けて、いろんな場面でサイコロトークを楽しもう！</strong>
            <p>マイテーマを選ぶと、右上のペンやメニューからテーマ編集を開けます。</p>
          </div>
        </aside>
      </section>
    </div>
  );
};
