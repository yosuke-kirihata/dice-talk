import {
  IoBulbOutline,
  IoCheckmark,
  IoClose,
  IoColorPalette,
  IoCreateOutline,
  IoDice,
  IoHeartOutline,
  IoMenu,
  IoOptionsOutline,
} from 'react-icons/io5';

interface UsageDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

/** サイコロトークの基本操作とボタンの役割を表示する使い方ダイアログ。 */
export const UsageDialog = ({ open, onClose }: UsageDialogProps): React.JSX.Element | null => {
  if (!open) return null;

  return (
    <div className="usage-screen" role="dialog" aria-modal="true" aria-labelledby="usage-title">
      <button
        type="button"
        className="usage-screen__backdrop"
        aria-label="使い方を閉じる"
        onClick={onClose}
      />
      <section className="usage-panel">
        <header className="usage-panel__header">
          <button
            type="button"
            className="usage-panel__close"
            aria-label="使い方を閉じる"
            onClick={onClose}
          >
            <IoClose aria-hidden />
          </button>
          <h2 id="usage-title">使い方</h2>
          <span aria-hidden />
        </header>

        <div className="usage-panel__body">
          <div className="usage-hero">
            <div className="usage-hero__icon" aria-hidden>
              <span />
            </div>
            <h3>サイコロトークの使い方</h3>
            <p>サイコロを振って、出たお題で楽しくトークしましょう！</p>
          </div>

          <section className="usage-steps" aria-labelledby="usage-steps-title">
            <h3 id="usage-steps-title" className="usage-section-title">
              基本操作
            </h3>
            <article className="usage-step">
              <div className="usage-step__number">1</div>
              <div className="usage-dice usage-dice--press" aria-hidden>
                <span />
              </div>
              <div>
                <h4>サイコロを長押し</h4>
                <p>画面下のボタン、またはサイコロを長押しすると準備モードに入ります。</p>
              </div>
            </article>

            <article className="usage-step">
              <div className="usage-step__number">2</div>
              <div className="usage-dice usage-dice--spin" aria-hidden>
                <span />
              </div>
              <div>
                <h4>指を離してサイコロを振る</h4>
                <p>指を離すとサイコロが回転します。どのお題が出るかはお楽しみ！</p>
              </div>
            </article>

            <article className="usage-step">
              <div className="usage-step__number">3</div>
              <div className="usage-dice usage-dice--result" aria-hidden>
                <span />
              </div>
              <div>
                <h4>出目が確定！</h4>
                <p>回転が止まると、サイコロの正面のお題が表示されます。</p>
              </div>
            </article>
          </section>

          <aside className="usage-point">
            <h3>
              <IoBulbOutline aria-hidden />
              ポイント
            </h3>
            <ul>
              <li>
                <IoCheckmark aria-hidden />
                お題はテーマごとに自由に設定できます
              </li>
              <li>
                <IoCheckmark aria-hidden />
                話題に困ったときや、盛り上げたいときにぴったり！
              </li>
              <li>
                <IoCheckmark aria-hidden />
                友達や家族、グループでも楽しく使えます
              </li>
            </ul>
          </aside>

          <section className="usage-buttons" aria-labelledby="usage-buttons-title">
            <h3 id="usage-buttons-title">各ボタンの説明</h3>
            <div className="usage-buttons__grid">
              <div className="usage-button-guide">
                <span>
                  <IoMenu aria-hidden />
                </span>
                <h4>メニュー</h4>
                <p>
                  テーマ選択、
                  <wbr />
                  動作設定、
                  <wbr />
                  使い方を
                  <wbr />
                  開きます
                </p>
              </div>
              <div className="usage-button-guide">
                <span>
                  <IoColorPalette aria-hidden />
                </span>
                <h4>テーマ選択</h4>
                <p>
                  マイテーマと
                  <wbr />
                  プリセットを
                  <wbr />
                  切り替えます
                </p>
              </div>
              <div className="usage-button-guide">
                <span>
                  <IoCreateOutline aria-hidden />
                </span>
                <h4>テーマ編集</h4>
                <p>
                  選択中の
                  <wbr />
                  マイテーマ名、
                  <wbr />
                  お題、
                  <wbr />
                  面の色を
                  <wbr />
                  編集します
                </p>
              </div>
              <div className="usage-button-guide">
                <span>
                  <IoOptionsOutline aria-hidden />
                </span>
                <h4>動作設定</h4>
                <p>
                  角丸、
                  <wbr />
                  サイズ、
                  <wbr />
                  回転、
                  <wbr />
                  軸表示、
                  <wbr />
                  効果音を
                  <wbr />
                  変更します
                </p>
              </div>
              <div className="usage-button-guide">
                <span>
                  <IoDice aria-hidden />
                </span>
                <h4>サイコロ</h4>
                <p>
                  長押しして
                  <wbr />
                  離すと
                  <wbr />
                  サイコロを
                  <wbr />
                  振ります
                </p>
              </div>
            </div>
          </section>

          <div className="usage-footer">
            <IoHeartOutline aria-hidden />
            <div>
              <h3>みんなで楽しいトークタイムを！</h3>
              <p>サイコロが素敵な会話のきっかけになりますように。</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
