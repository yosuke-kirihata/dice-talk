import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { type AudioCueConfig, AudioCuePlayer, DEFAULT_AUDIO_CUE_CONFIG } from '@/features/audio';
import type { AudioFileStore } from '@/features/audio/storage/webAudioFileStore';
import { DEFAULT_DICE_DESIGN } from '@/features/dice';
import { DEFAULT_SPIN_CONFIG } from '@/features/pose';
import type { DebugDesignState } from '../model/debugDesignState';
import { AppSettingsPanel } from './AppSettingsPanel';

const DEFAULT_DEBUG_DESIGN: DebugDesignState = {
  ...DEFAULT_DICE_DESIGN,
  spin: DEFAULT_SPIN_CONFIG,
  showWorldAxes: false,
  showLocalAxes: false,
  showUpArrow: false,
};

const renderPanel = (overrides?: Partial<DebugDesignState>) => {
  const value: DebugDesignState = { ...DEFAULT_DEBUG_DESIGN, ...overrides };
  const onChange = vi.fn<(next: DebugDesignState) => void>();
  render(<AppSettingsPanel value={value} onChange={onChange} />);
  return { onChange };
};

describe('AppSettingsPanel', () => {
  it('renders dice shape controls', () => {
    renderPanel();
    expect(screen.getByLabelText(/角丸/)).toBeInTheDocument();
    expect(screen.getByLabelText(/サイズ/)).toBeInTheDocument();
  });

  it('fires onChange with new radius when slider moves', () => {
    const { onChange } = renderPanel();
    fireEvent.change(screen.getByLabelText(/角丸/), { target: { value: '0.25' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ radius: 0.25 }));
  });

  it('fires onChange with new size when slider moves', () => {
    const { onChange } = renderPanel();
    fireEvent.change(screen.getByLabelText(/サイズ/), { target: { value: '1.5' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ size: 1.5 }));
  });

  it('clamps radius when size becomes smaller than the current radius allows', () => {
    const { onChange } = renderPanel({ radius: 1.2, size: 2.5 });
    fireEvent.change(screen.getByLabelText(/サイズ/), { target: { value: '1' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ size: 1, radius: 0.5 }));
  });

  it('renders spin motion controls', () => {
    renderPanel();
    expect(screen.getByLabelText('回転 長押し ms')).toBeInTheDocument();
    expect(screen.getByLabelText('回転 時間 ms')).toBeInTheDocument();
    expect(screen.getByLabelText('回転 停止 ms')).toBeInTheDocument();
  });

  it('fires onChange with updated spin timing', () => {
    const { onChange } = renderPanel();
    fireEvent.change(screen.getByLabelText('回転 長押し ms'), {
      target: { value: '600' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ spin: expect.objectContaining({ holdMs: 600 }) }),
    );
  });

  it('fires onChange with updated spin speed table cell', () => {
    const { onChange } = renderPanel();
    fireEvent.change(screen.getByLabelText('回転キーフレーム 1 速度'), {
      target: { value: '40' },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        spin: expect.objectContaining({
          keyframes: expect.arrayContaining([expect.objectContaining({ at: 0, speed: 40 })]),
        }),
      }),
    );
  });

  it('renders 3 arrow toggles (world / local / up)', () => {
    renderPanel();
    expect(screen.getByLabelText(/ワールド軸/)).toBeInTheDocument();
    expect(screen.getByLabelText(/ローカル軸/)).toBeInTheDocument();
    expect(screen.getByLabelText(/上方向矢印/)).toBeInTheDocument();
  });

  it('toggling world axes off fires onChange with showWorldAxes:false', () => {
    const { onChange } = renderPanel({ showWorldAxes: true });
    fireEvent.click(screen.getByLabelText(/ワールド軸/));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ showWorldAxes: false }));
  });

  it('toggling local axes off fires onChange with showLocalAxes:false', () => {
    const { onChange } = renderPanel({ showLocalAxes: true });
    fireEvent.click(screen.getByLabelText(/ローカル軸/));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ showLocalAxes: false }));
  });

  it('toggling up arrow off fires onChange with showUpArrow:false', () => {
    const { onChange } = renderPanel({ showUpArrow: true });
    fireEvent.click(screen.getByLabelText(/上方向矢印/));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ showUpArrow: false }));
  });

  it('renders audio cue controls when audio props are provided', () => {
    const value: DebugDesignState = { ...DEFAULT_DEBUG_DESIGN };
    const onChange = vi.fn<(next: DebugDesignState) => void>();
    const onAudioCueConfigChange = vi.fn<(next: AudioCueConfig) => void>();
    const audioFileStore: AudioFileStore = {
      save: vi.fn(),
      load: vi.fn(),
      delete: vi.fn(),
    };
    const audioCuePlayer = new AudioCuePlayer(() => ({
      play: vi.fn(),
      stop: vi.fn(),
      unload: vi.fn(),
    }));

    render(
      <AppSettingsPanel
        value={value}
        onChange={onChange}
        audioCueConfig={DEFAULT_AUDIO_CUE_CONFIG}
        onAudioCueConfigChange={onAudioCueConfigChange}
        audioFileStore={audioFileStore}
        audioCuePlayer={audioCuePlayer}
      />,
    );

    expect(screen.getByText(/効果音/)).toBeInTheDocument();
    expect(screen.getByLabelText(/音声ファイル/)).toBeInTheDocument();
  });

  it('reset button restores app behavior settings and audio defaults', () => {
    const value: DebugDesignState = {
      ...DEFAULT_DEBUG_DESIGN,
      radius: 0.4,
      size: 2,
      spin: { ...DEFAULT_SPIN_CONFIG, holdMs: DEFAULT_SPIN_CONFIG.holdMs + 100 },
      showWorldAxes: true,
      faceTexts: { ...DEFAULT_DICE_DESIGN.faceTexts, 1: '残す' },
    };
    const onChange = vi.fn<(next: DebugDesignState) => void>();
    const onAudioCueConfigChange = vi.fn<(next: AudioCueConfig) => void>();
    render(
      <AppSettingsPanel
        value={value}
        onChange={onChange}
        audioCueConfig={{ ...DEFAULT_AUDIO_CUE_CONFIG, enabled: true }}
        onAudioCueConfigChange={onAudioCueConfigChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /動作設定を初期化/ }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        radius: DEFAULT_DICE_DESIGN.radius,
        size: DEFAULT_DICE_DESIGN.size,
        spin: DEFAULT_SPIN_CONFIG,
        showWorldAxes: false,
        showLocalAxes: false,
        showUpArrow: false,
        faceTexts: value.faceTexts,
      }),
    );
    expect(onAudioCueConfigChange).toHaveBeenCalledWith(DEFAULT_AUDIO_CUE_CONFIG);
  });
});
