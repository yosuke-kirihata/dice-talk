import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AudioCuePlayer, DEFAULT_AUDIO_CUE_CONFIG } from '@/features/audio';
import { DEFAULT_APP_DESIGN } from '@/types/appDesignState';
import { ScriptedPoseSource } from '@/features/pose';
import { AppSheets } from './AppSheets';

vi.mock('@/features/debug', () => ({
  DebugSheet: ({ mode, actionLabel, mockSuffix, themeName }: Record<string, string>) => (
    <div data-testid={`sheet-${mode}`}>
      {mode}
      {actionLabel}
      {mockSuffix}
      {themeName}
    </div>
  ),
}));

describe('AppSheets', () => {
  const audioCuePlayer = () =>
    new AudioCuePlayer(() => ({
      play: vi.fn(),
      stop: vi.fn(),
      unload: vi.fn(),
    }));

  it('renders design, settings, and debug sheets with derived labels', () => {
    const poseSource = new ScriptedPoseSource([{ quat: [0, 0, 0, 1], timestamp: 0 }]);
    const activeCustomTheme = {
      id: 'theme-1',
      name: '既存テーマ',
      faceTexts: DEFAULT_APP_DESIGN.faceTexts,
      faceColors: DEFAULT_APP_DESIGN.faceColors,
    };
    render(
      <AppSheets
        poseSource={poseSource}
        design={DEFAULT_APP_DESIGN}
        draftCustomTheme={activeCustomTheme}
        customThemes={[activeCustomTheme]}
        activeCustomTheme={activeCustomTheme}
        themeEditorOpen
        appSettingsOpen
        debugOpen
        debugMockEnabled
        audioCueConfig={DEFAULT_AUDIO_CUE_CONFIG}
        audioFileStore={{ save: vi.fn(), load: vi.fn(), delete: vi.fn() }}
        audioCuePlayer={audioCuePlayer()}
        onDesignChange={vi.fn()}
        onThemeNameChange={vi.fn()}
        onCloseThemeEditor={vi.fn()}
        onConfirmCustomTheme={vi.fn()}
        onAppSettingsChange={vi.fn()}
        onAudioCueConfigChange={vi.fn()}
        onAppSettingsOpenChange={vi.fn()}
        onDebugOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId('sheet-design')).toHaveTextContent('編集を確定');
    expect(screen.getByTestId('sheet-design')).toHaveTextContent('既存テーマ');
    expect(screen.getByTestId('sheet-settings')).toBeInTheDocument();
    expect(screen.getByTestId('sheet-debug')).toHaveTextContent('(mock)');
  });

  it('uses create label for a draft that is not already saved', () => {
    const poseSource = new ScriptedPoseSource([{ quat: [0, 0, 0, 1], timestamp: 0 }]);
    const draft = {
      id: 'new-theme',
      name: '新規',
      faceTexts: DEFAULT_APP_DESIGN.faceTexts,
      faceColors: DEFAULT_APP_DESIGN.faceColors,
    };
    render(
      <AppSheets
        poseSource={poseSource}
        design={DEFAULT_APP_DESIGN}
        draftCustomTheme={draft}
        customThemes={[]}
        activeCustomTheme={undefined}
        themeEditorOpen
        appSettingsOpen={false}
        debugOpen={false}
        debugMockEnabled={false}
        audioCueConfig={DEFAULT_AUDIO_CUE_CONFIG}
        audioFileStore={{ save: vi.fn(), load: vi.fn(), delete: vi.fn() }}
        audioCuePlayer={audioCuePlayer()}
        onDesignChange={vi.fn()}
        onThemeNameChange={vi.fn()}
        onCloseThemeEditor={vi.fn()}
        onConfirmCustomTheme={vi.fn()}
        onAppSettingsChange={vi.fn()}
        onAudioCueConfigChange={vi.fn()}
        onAppSettingsOpenChange={vi.fn()}
        onDebugOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('sheet-design')).toHaveTextContent('テーマを作成');
  });
});
