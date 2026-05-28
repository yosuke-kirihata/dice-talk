interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly message: string;
  readonly confirmLabel: string;
  readonly cancelLabel?: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

/** 破壊的操作など、ユーザー確認が必要な処理の前に表示する確認ダイアログ。 */
export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'キャンセル',
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.JSX.Element | null => {
  if (!open) return null;

  return (
    <div className="confirm-screen" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <button
        type="button"
        className="confirm-screen__backdrop"
        aria-label={cancelLabel}
        onClick={onCancel}
      />
      <section className="confirm-panel">
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="confirm-panel__actions">
          <button type="button" className="confirm-panel__cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="confirm-panel__confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
};
