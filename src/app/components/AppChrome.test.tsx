import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppChrome } from './AppChrome';

const renderChrome = (overrides: Partial<React.ComponentProps<typeof AppChrome>> = {}) => {
  const props: React.ComponentProps<typeof AppChrome> = {
    menuOpen: false,
    activeThemeName: 'デフォルト',
    canEditActiveTheme: true,
    onOpenMenu: vi.fn(),
    onOpenThemeSelect: vi.fn(),
    onOpenDesignSettings: vi.fn(),
    onCtaPointerDown: vi.fn(),
    onCtaPointerMove: vi.fn(),
    onCtaPointerUp: vi.fn(),
    ...overrides,
  };
  render(<AppChrome {...props} />);
  return props;
};

describe('AppChrome', () => {
  it('dispatches top chrome actions', async () => {
    const user = userEvent.setup();
    const props = renderChrome();

    await user.click(screen.getByRole('button', { name: 'メニューを開く' }));
    await user.click(screen.getByRole('button', { name: /デフォルト/ }));
    await user.click(screen.getByRole('button', { name: 'テーマを編集' }));

    expect(props.onOpenMenu).toHaveBeenCalledOnce();
    expect(props.onOpenThemeSelect).toHaveBeenCalledOnce();
    expect(props.onOpenDesignSettings).toHaveBeenCalledOnce();
  });

  it('renders a spacer when the active theme cannot be edited', () => {
    renderChrome({ canEditActiveTheme: false });
    expect(screen.queryByRole('button', { name: 'テーマを編集' })).not.toBeInTheDocument();
  });
});
