import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UsageDialog } from './UsageDialog';

describe('UsageDialog', () => {
  it('returns null when closed', () => {
    const { container } = render(<UsageDialog open={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders usage content and closes from the close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<UsageDialog open onClose={onClose} />);

    expect(screen.getByRole('dialog', { name: '使い方' })).toBeInTheDocument();
    expect(screen.getByText('基本操作')).toBeInTheDocument();

    const closeButton = screen.getAllByRole('button', { name: '使い方を閉じる' })[1];
    expect(closeButton).toBeDefined();
    await user.click(closeButton as HTMLElement);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
