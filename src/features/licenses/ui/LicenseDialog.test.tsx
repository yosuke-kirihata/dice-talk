import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LicenseDialog } from './LicenseDialog';

describe('LicenseDialog', () => {
  it('returns null when closed', () => {
    const { container } = render(<LicenseDialog open={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders license records and closes', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<LicenseDialog open onClose={onClose} />);

    expect(screen.getByRole('dialog', { name: 'OSSライセンス' })).toBeInTheDocument();
    expect(screen.getByText('howler')).toBeInTheDocument();

    const closeButton = screen.getAllByRole('button', { name: 'OSSライセンスを閉じる' })[1];
    expect(closeButton).toBeDefined();
    await user.click(closeButton as HTMLElement);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
