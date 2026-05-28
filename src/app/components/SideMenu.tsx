import {
  IoClose,
  IoColorPalette,
  IoCreateOutline,
  IoDocumentTextOutline,
  IoHelpCircleOutline,
  IoOptionsOutline,
} from 'react-icons/io5';
import packageJson from '../../../package.json';

interface SideMenuProps {
  readonly open: boolean;
  readonly canEditActiveTheme: boolean;
  readonly onClose: () => void;
  readonly onOpenDesignSettings: () => void;
  readonly onOpenThemeSelect: () => void;
  readonly onOpenAppSettings: () => void;
  readonly onOpenUsage: () => void;
  readonly onOpenLicenses: () => void;
}

/** アプリ内の主要導線をまとめた左スライドメニュー。 */
export const SideMenu = ({
  open,
  canEditActiveTheme,
  onClose,
  onOpenDesignSettings,
  onOpenThemeSelect,
  onOpenAppSettings,
  onOpenUsage,
  onOpenLicenses,
}: SideMenuProps): React.JSX.Element => (
  <div className={['side-menu-scrim', open ? 'is-open' : ''].join(' ')} aria-hidden={!open}>
    <button
      type="button"
      className="side-menu-scrim__backdrop"
      aria-label="メニューを閉じる"
      onClick={onClose}
    />
    <nav className="side-menu" aria-label="メニュー">
      <button
        type="button"
        className="side-menu__close"
        aria-label="メニューを閉じる"
        onClick={onClose}
      >
        <IoClose aria-hidden />
      </button>
      {canEditActiveTheme ? (
        <button type="button" className="side-menu__item" onClick={onOpenDesignSettings}>
          <IoCreateOutline aria-hidden />
          テーマ編集
        </button>
      ) : null}
      <button type="button" className="side-menu__item" onClick={onOpenThemeSelect}>
        <IoColorPalette aria-hidden />
        テーマ選択
      </button>
      <button type="button" className="side-menu__item" onClick={onOpenAppSettings}>
        <IoOptionsOutline aria-hidden />
        動作設定
      </button>
      <button type="button" className="side-menu__item" onClick={onOpenUsage}>
        <IoHelpCircleOutline aria-hidden />
        使い方
      </button>
      <div className="side-menu__spacer" />
      <button
        type="button"
        className="side-menu__item side-menu__item--subtle"
        onClick={onOpenLicenses}
      >
        <IoDocumentTextOutline aria-hidden />
        OSSライセンス
      </button>
      <div className="side-menu__version">バージョン {packageJson.version}</div>
    </nav>
  </div>
);
