import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_DICE_DESIGN } from '@/features/dice';
import { DEFAULT_SPIN_CONFIG } from '@/features/pose';
import { ScriptedPoseSource } from '@/features/pose/sources/scriptedPoseSource';
import type { DebugDesignState } from '../model/debugDesignState';
import { DebugSheet } from './DebugSheet';

const chartViewMock = vi.hoisted(() => ({
  fn: vi.fn((_props: { active: boolean; poseSource: unknown }) => null),
}));

vi.mock('./DebugChartView', () => ({
  DebugChartView: chartViewMock.fn,
}));

const DEFAULT_DEBUG_DESIGN: DebugDesignState = {
  ...DEFAULT_DICE_DESIGN,
  spin: DEFAULT_SPIN_CONFIG,
  showWorldAxes: false,
  showLocalAxes: false,
  showUpArrow: false,
};

const renderSheet = (overrides?: {
  open?: boolean;
  design?: DebugDesignState;
  mode?: 'design' | 'settings' | 'debug';
  mockSuffix?: string;
  onOpenChange?: (next: boolean) => void;
  onDesignChange?: (next: DebugDesignState) => void;
  actionLabel?: string;
  onAction?: () => void;
}) => {
  const src = new ScriptedPoseSource([{ quat: [0, 0, 0, 1], timestamp: 0 }]);
  const onOpenChange = overrides?.onOpenChange ?? vi.fn();
  const onDesignChange = overrides?.onDesignChange ?? vi.fn();
  const props = {
    poseSource: src,
    design: overrides?.design ?? DEFAULT_DEBUG_DESIGN,
    onDesignChange,
    open: overrides?.open ?? true,
    onOpenChange,
    ...(overrides?.mode !== undefined ? { mode: overrides.mode } : {}),
    ...(overrides?.mockSuffix !== undefined ? { mockSuffix: overrides.mockSuffix } : {}),
    ...(overrides?.actionLabel !== undefined ? { actionLabel: overrides.actionLabel } : {}),
    ...(overrides?.onAction !== undefined ? { onAction: overrides.onAction } : {}),
  };
  const utils = render(<DebugSheet {...props} />);
  return { ...utils, onOpenChange, onDesignChange, src };
};

describe('DebugSheet', () => {
  beforeEach(() => {
    chartViewMock.fn.mockClear();
  });
  afterEach(() => {
    // testing-library cleanup runs in setup
  });

  it('renders the theme editor dialog without settings tabs', () => {
    renderSheet();
    expect(screen.getByRole('dialog', { name: 'テーマ編集' })).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('renders the debug dialog title with a mock suffix when provided', () => {
    renderSheet({ mode: 'debug', mockSuffix: ' (mock)' });
    expect(screen.getByRole('dialog', { name: /デバッグ \(mock\)/ })).toBeInTheDocument();
  });

  it('renders the app settings dialog separately from theme editing', () => {
    renderSheet({ mode: 'settings' });
    expect(screen.getByRole('dialog', { name: '動作設定' })).toBeInTheDocument();
    expect(screen.getByLabelText('回転 長押し ms')).toBeInTheDocument();
    expect(screen.queryByLabelText('面 1 テキスト')).not.toBeInTheDocument();
  });

  it('defaults to the theme editor when opened', () => {
    renderSheet({ open: true });
    expect(screen.getByLabelText('面 1 テキスト')).toBeInTheDocument();
    expect(screen.queryByLabelText('回転 長押し ms')).not.toBeInTheDocument();
  });

  it('debug mode activates the chart view', () => {
    renderSheet({ open: true, mode: 'debug' });
    const lastProps = chartViewMock.fn.mock.calls.at(-1)?.[0];
    expect(lastProps?.active).toBe(true);
  });

  it('theme editor mode does not activate the chart view', () => {
    renderSheet({ open: true });
    expect(chartViewMock.fn).not.toHaveBeenCalled();
    expect(screen.getByLabelText('面 1 テキスト')).toBeInTheDocument();
  });

  it('renders and invokes the optional footer action', () => {
    const onAction = vi.fn();
    renderSheet({ open: true, actionLabel: 'テーマを作成', onAction });
    fireEvent.click(screen.getByRole('button', { name: 'テーマを作成' }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('keeps the panel closed when open=false', () => {
    renderSheet({ open: false });
    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('hidden');
    expect(screen.queryByRole('tab', { hidden: true })).not.toBeInTheDocument();
  });

  it('clicking the close button invokes onOpenChange with false', () => {
    const onOpenChange = vi.fn();
    renderSheet({ open: true, onOpenChange });
    const closeButtons = screen.getAllByRole('button', { name: 'テーマ編集を閉じる' });
    expect(closeButtons).toHaveLength(2);
    const headerClose = closeButtons[1];
    expect(headerClose).toBeDefined();
    (headerClose as HTMLElement).click();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('forwards the poseSource to DebugChartView in debug mode', () => {
    const { src } = renderSheet({ open: true, mode: 'debug' });
    const lastProps = chartViewMock.fn.mock.calls.at(-1)?.[0];
    expect(lastProps?.poseSource).toBe(src);
  });

  it('design changes flow through onDesignChange', () => {
    const onDesignChange = vi.fn();
    renderSheet({ open: true, onDesignChange });
    screen.getByRole('button', { name: /初期化/ }).click();
    expect(onDesignChange).toHaveBeenCalled();
  });
});
