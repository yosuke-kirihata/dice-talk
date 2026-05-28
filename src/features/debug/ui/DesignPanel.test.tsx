import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_DICE_DESIGN, type DiceDesignState } from '@/features/dice';
import { DesignPanel } from './DesignPanel';

const renderPanel = (overrides?: Partial<DiceDesignState>) => {
  const value: DiceDesignState = { ...DEFAULT_DICE_DESIGN, ...overrides };
  const onChange = vi.fn<(next: DiceDesignState) => void>();
  render(<DesignPanel value={value} onChange={onChange} />);
  return { onChange };
};

describe('DesignPanel', () => {
  it('renders text inputs for all six faces', () => {
    renderPanel();
    for (const pip of [1, 2, 3, 4, 5, 6]) {
      expect(screen.getByLabelText(`面 ${pip} テキスト`)).toBeInTheDocument();
    }
  });

  it('renders color controls for all six faces', () => {
    renderPanel();
    for (const pip of [1, 2, 3, 4, 5, 6]) {
      expect(screen.getByLabelText(`面 ${pip} 色選択`)).toBeInTheDocument();
      expect(screen.getByLabelText(`面 ${pip} 色コード`)).toBeInTheDocument();
    }
  });

  it('fires onChange with updated text for a face', () => {
    const { onChange } = renderPanel();
    fireEvent.change(screen.getByLabelText('面 1 テキスト'), { target: { value: '勝' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ faceTexts: expect.objectContaining({ 1: '勝' }) }),
    );
  });

  it('allows multiline text for a face', () => {
    const { onChange } = renderPanel();
    fireEvent.change(screen.getByLabelText('面 2 テキスト'), {
      target: { value: '大吉\n小吉' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ faceTexts: expect.objectContaining({ 2: '大吉\n小吉' }) }),
    );
  });

  it('fires onChange with updated color for a face', () => {
    const { onChange } = renderPanel();
    fireEvent.change(screen.getByLabelText('面 1 色コード'), {
      target: { value: '#123456' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ faceColors: expect.objectContaining({ 1: '#123456' }) }),
    );
  });

  it('ignores invalid color hex input', () => {
    const { onChange } = renderPanel();
    fireEvent.change(screen.getByLabelText('面 1 色コード'), {
      target: { value: 'red' },
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reset button restores only theme values', () => {
    const { onChange } = renderPanel({ radius: 0.4, size: 2 });
    fireEvent.click(screen.getByRole('button', { name: /初期化/ }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        radius: 0.4,
        size: 2,
        faceTexts: DEFAULT_DICE_DESIGN.faceTexts,
        faceColors: DEFAULT_DICE_DESIGN.faceColors,
      }),
    );
  });

  it('trims empty theme names back to the current theme on blur', () => {
    const onThemeNameChange = vi.fn<(next: string) => void>();
    render(
      <DesignPanel
        value={DEFAULT_DICE_DESIGN}
        onChange={() => undefined}
        themeName="現在のテーマ"
        onThemeNameChange={onThemeNameChange}
      />,
    );

    fireEvent.blur(screen.getByLabelText('テーマ名'), { target: { value: '   ' } });

    expect(onThemeNameChange).toHaveBeenCalledWith('現在のテーマ');
  });

  it('allows theme name input without a change handler', () => {
    render(<DesignPanel value={DEFAULT_DICE_DESIGN} onChange={() => undefined} />);

    expect(() => {
      fireEvent.change(screen.getByLabelText('テーマ名'), { target: { value: '新テーマ' } });
      fireEvent.blur(screen.getByLabelText('テーマ名'), { target: { value: '新テーマ' } });
    }).not.toThrow();
  });
});
