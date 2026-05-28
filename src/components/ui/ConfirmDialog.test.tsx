import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('returns null when closed', () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        title="削除"
        message="削除しますか？"
        confirmLabel="削除"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('calls cancel and confirm handlers', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="削除"
        message="削除しますか？"
        confirmLabel="削除"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    const cancelButton = screen.getAllByRole('button', { name: 'キャンセル' })[1];
    expect(cancelButton).toBeDefined();
    await user.click(cancelButton as HTMLElement);
    await user.click(screen.getByRole('button', { name: '削除' }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
