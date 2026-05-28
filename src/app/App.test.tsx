import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { customThemeActiveId } from '@/features/dice';
import { DEFAULT_APP_DESIGN } from '@/types/appDesignState';
import App from './App';
import { useAppStore } from '@/store/appStore';

vi.mock('@/features/dice', async () => {
  const actual = await vi.importActual<typeof import('@/features/dice')>('@/features/dice');
  return {
    ...actual,
    DiceCanvas: () => <div data-testid="dice-canvas" />,
  };
});

vi.mock('@/features/pose', async () => {
  const actual = await vi.importActual<typeof import('@/features/pose')>('@/features/pose');
  return {
    ...actual,
    TouchInputLayer: ({ onSpinStart }: { readonly onSpinStart?: () => void }) => (
      <button type="button" onClick={onSpinStart}>
        touch-layer
      </button>
    ),
  };
});

vi.mock('@/features/licenses', () => ({
  LicenseDialog: ({ open, onClose }: { readonly open: boolean; readonly onClose: () => void }) =>
    open ? (
      <button type="button" onClick={onClose}>
        license-dialog
      </button>
    ) : null,
}));

vi.mock('@/features/usage', () => ({
  UsageDialog: ({ open, onClose }: { readonly open: boolean; readonly onClose: () => void }) =>
    open ? (
      <button type="button" onClick={onClose}>
        usage-dialog
      </button>
    ) : null,
}));

vi.mock('@/features/theme', async () => {
  const actual = await vi.importActual<typeof import('@/features/theme')>('@/features/theme');
  return {
    ...actual,
    ThemeSelectDialog: ({
      open,
      customThemes,
      onClose,
      onDeleteCustomTheme,
    }: {
      readonly open: boolean;
      readonly customThemes: readonly { id: string; name: string }[];
      readonly onClose: () => void;
      readonly onDeleteCustomTheme: (theme: { id: string; name: string }) => void;
    }) =>
      open ? (
        <div>
          <button type="button" onClick={onClose}>
            theme-dialog
          </button>
          {customThemes.map((theme) => (
            <button type="button" key={theme.id} onClick={() => onDeleteCustomTheme(theme)}>
              delete-{theme.name}
            </button>
          ))}
        </div>
      ) : null,
  };
});

vi.mock('@/features/debug', () => {
  class MockPoseSource {
    readonly id = 'mock';
    getCurrentPose = () => ({ quat: [0, 0, 0, 1] as const, timestamp: 0 });
    subscribe = () => () => undefined;
    start = async () => undefined;
    stop = async () => undefined;
  }
  return {
    isDebugMockEnabled: () => false,
    MockPoseSource,
    DebugSheet: ({ open, mode }: { readonly open: boolean; readonly mode: string }) =>
      open ? <div>sheet-{mode}</div> : null,
  };
});

describe('App', () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState(), true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main canvas and opens menu flows', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByTestId('dice-canvas')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'メニューを開く' }));
    await user.click(screen.getByRole('button', { name: '使い方' }));
    expect(screen.getByRole('button', { name: 'usage-dialog' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'usage-dialog' }));
    await user.click(screen.getByRole('button', { name: 'メニューを開く' }));
    await user.click(screen.getByRole('button', { name: 'OSSライセンス' }));
    expect(screen.getByRole('button', { name: 'license-dialog' })).toBeInTheDocument();
  });

  it('confirms deletion for a custom theme', async () => {
    const user = userEvent.setup();
    const customTheme = {
      id: 'theme-app',
      name: '消すテーマ',
      faceTexts: DEFAULT_APP_DESIGN.faceTexts,
      faceColors: DEFAULT_APP_DESIGN.faceColors,
    };
    localStorage.setItem(
      'dice-talk.customThemes.v1',
      JSON.stringify({ version: 1, themes: [customTheme] }),
    );

    render(<App />);
    await screen.findByRole('button', { name: /消すテーマ/ });
    useAppStore.setState({ activeThemeId: customThemeActiveId(customTheme.id) });
    await user.click(screen.getByRole('button', { name: /消すテーマ/ }));
    await user.click(screen.getByRole('button', { name: 'delete-消すテーマ' }));
    await user.click(screen.getByRole('button', { name: '削除' }));

    expect(useAppStore.getState().customThemes).toEqual([]);
  });
});
