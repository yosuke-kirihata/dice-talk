import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  customThemeActiveId,
  DEFAULT_FACE_COLORS_BY_PIP,
  DEFAULT_FACE_TEXTS,
  THEME_PRESETS,
} from '@/features/dice';
import { ThemeSelectDialog } from './ThemeSelectDialog';

const renderDialog = (overrides: Partial<React.ComponentProps<typeof ThemeSelectDialog>> = {}) => {
  const props: React.ComponentProps<typeof ThemeSelectDialog> = {
    open: true,
    themeTab: 'my',
    customThemes: [],
    activeThemeId: 'default',
    onClose: vi.fn(),
    onThemeTabChange: vi.fn(),
    onSelectTheme: vi.fn(),
    onSelectCustomTheme: vi.fn(),
    onEditCustomTheme: vi.fn(),
    onDeleteCustomTheme: vi.fn(),
    onCreateCustomTheme: vi.fn(),
    ...overrides,
  };
  const view = render(<ThemeSelectDialog {...props} />);
  return { ...props, ...view };
};

describe('ThemeSelectDialog', () => {
  it('returns null when closed', () => {
    const { container } = renderDialog({ open: false });
    expect(container).toBeEmptyDOMElement();
  });

  it('does not show preset themes on the my theme tab when the list is empty', () => {
    renderDialog();

    expect(screen.queryByRole('button', { name: 'デフォルトテーマを選択' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '新しいテーマを作る' })).toBeInTheDocument();
  });

  it('dispatches my-theme actions', async () => {
    const user = userEvent.setup();
    const customTheme = {
      id: 'theme-1',
      name: 'マイテーマ',
      faceTexts: DEFAULT_FACE_TEXTS,
      faceColors: DEFAULT_FACE_COLORS_BY_PIP,
    };
    const props = renderDialog({
      customThemes: [customTheme],
      activeThemeId: customThemeActiveId(customTheme.id),
    });

    expect(screen.getByRole('button', { name: 'マイテーマを選択' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'マイテーマを編集' }));
    await user.click(screen.getByRole('button', { name: 'マイテーマを削除' }));
    await user.click(screen.getByRole('button', { name: 'マイテーマを選択' }));
    await user.click(screen.getByRole('button', { name: '新しいテーマを作る' }));

    expect(props.onEditCustomTheme).toHaveBeenCalledWith(customTheme);
    expect(props.onDeleteCustomTheme).toHaveBeenCalledWith(customTheme);
    expect(props.onSelectCustomTheme).toHaveBeenCalledWith(customTheme);
    expect(props.onCreateCustomTheme).toHaveBeenCalledOnce();
  });

  it('dispatches preset tab actions and close', async () => {
    const user = userEvent.setup();
    const props = renderDialog({ themeTab: 'preset', activeThemeId: 'default' });

    expect(screen.getByRole('button', { name: 'デフォルトテーマを選択' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('tab', { name: 'マイテーマ' }));
    await user.click(screen.getByRole('button', { name: '飲み会トークを選択' }));
    const closeButton = screen.getAllByRole('button', { name: 'テーマ選択を閉じる' })[1];
    expect(closeButton).toBeDefined();
    await user.click(closeButton as HTMLElement);

    expect(props.onThemeTabChange).toHaveBeenCalledWith('my');
    expect(props.onSelectTheme).toHaveBeenCalledWith(THEME_PRESETS[1]);
    expect(props.onClose).toHaveBeenCalledOnce();
  });
});
