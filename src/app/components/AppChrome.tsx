import { IoChevronDown, IoColorPalette, IoCreateOutline, IoDice, IoMenu } from 'react-icons/io5';

interface AppChromeProps {
  readonly menuOpen: boolean;
  readonly activeThemeName: string;
  readonly canEditActiveTheme: boolean;
  readonly onOpenMenu: () => void;
  readonly onOpenThemeSelect: () => void;
  readonly onOpenDesignSettings: () => void;
  readonly onCtaPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  readonly onCtaPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
  readonly onCtaPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void;
}

/** メニュー、テーマ選択、テーマ編集、スピン CTA を配置するメイン画面のクローム。 */
export const AppChrome = ({
  menuOpen,
  activeThemeName,
  canEditActiveTheme,
  onOpenMenu,
  onOpenThemeSelect,
  onOpenDesignSettings,
  onCtaPointerDown,
  onCtaPointerMove,
  onCtaPointerUp,
}: AppChromeProps): React.JSX.Element => (
  <>
    <header className="app-chrome app-chrome--top" role="toolbar" aria-label="アプリ操作">
      <button
        type="button"
        className="chrome-button"
        aria-label="メニューを開く"
        aria-expanded={menuOpen}
        onClick={onOpenMenu}
      >
        <IoMenu aria-hidden />
      </button>
      <button type="button" className="theme-pill" onClick={onOpenThemeSelect}>
        <IoColorPalette aria-hidden />
        <span title={activeThemeName}>{activeThemeName}</span>
        <IoChevronDown aria-hidden />
      </button>
      {canEditActiveTheme ? (
        <button
          type="button"
          className="chrome-button chrome-button--accent"
          aria-label="テーマを編集"
          onClick={onOpenDesignSettings}
        >
          <IoCreateOutline aria-hidden />
        </button>
      ) : (
        <span className="chrome-button-spacer" aria-hidden />
      )}
    </header>

    <div className="app-chrome app-chrome--bottom" role="toolbar" aria-label="ショートカット">
      <button
        type="button"
        className="roll-cta"
        onPointerDown={onCtaPointerDown}
        onPointerMove={onCtaPointerMove}
        onPointerUp={onCtaPointerUp}
        onPointerCancel={onCtaPointerUp}
      >
        <IoDice aria-hidden />
        長押しして、サイコロをふる
      </button>
    </div>
  </>
);
