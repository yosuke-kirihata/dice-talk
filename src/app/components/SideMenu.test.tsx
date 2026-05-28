import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SideMenu } from './SideMenu';

const renderMenu = (overrides: Partial<React.ComponentProps<typeof SideMenu>> = {}) => {
  const props: React.ComponentProps<typeof SideMenu> = {
    open: true,
    canEditActiveTheme: true,
    onClose: vi.fn(),
    onOpenDesignSettings: vi.fn(),
    onOpenThemeSelect: vi.fn(),
    onOpenAppSettings: vi.fn(),
    onOpenUsage: vi.fn(),
    onOpenLicenses: vi.fn(),
    ...overrides,
  };
  render(<SideMenu {...props} />);
  return props;
};

describe('SideMenu', () => {
  it('dispatches menu actions', async () => {
    const user = userEvent.setup();
    const props = renderMenu();

    await user.click(screen.getByRole('button', { name: 'テーマ編集' }));
    await user.click(screen.getByRole('button', { name: 'テーマ選択' }));
    await user.click(screen.getByRole('button', { name: '動作設定' }));
    await user.click(screen.getByRole('button', { name: '使い方' }));
    await user.click(screen.getByRole('button', { name: 'OSSライセンス' }));
    const closeButton = screen.getAllByRole('button', { name: 'メニューを閉じる' })[1];
    expect(closeButton).toBeDefined();
    await user.click(closeButton as HTMLElement);

    expect(props.onOpenDesignSettings).toHaveBeenCalledOnce();
    expect(props.onOpenThemeSelect).toHaveBeenCalledOnce();
    expect(props.onOpenAppSettings).toHaveBeenCalledOnce();
    expect(props.onOpenUsage).toHaveBeenCalledOnce();
    expect(props.onOpenLicenses).toHaveBeenCalledOnce();
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('hides theme editing for preset themes', () => {
    renderMenu({ canEditActiveTheme: false });
    expect(screen.queryByRole('button', { name: 'テーマ編集' })).not.toBeInTheDocument();
  });
});
