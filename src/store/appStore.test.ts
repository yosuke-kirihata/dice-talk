import { describe, expect, it } from 'vitest';
import { DEFAULT_AUDIO_CUE_CONFIG } from '@/features/audio';
import { customThemeActiveId, THEME_PRESETS } from '@/features/dice';
import { DEFAULT_APP_DESIGN } from '@/types/appDesignState';
import { selectActiveCustomTheme, selectActiveThemeName, useAppStore } from './appStore';

describe('appStore theme hydration', () => {
  it('uses the default theme when no custom or migrated theme exists', () => {
    useAppStore.setState(useAppStore.getInitialState(), true);

    useAppStore.getState().hydrateFaceDesign(null, null, null);

    const state = useAppStore.getState();
    expect(state.customThemes).toEqual([]);
    expect(state.activeThemeId).toBe('default');
    expect(state.design.faceTexts).toEqual(THEME_PRESETS[0].faceTexts);
    expect(state.design.faceColors).toEqual(THEME_PRESETS[0].faceColors);
  });

  it('defers theme edits to the draft until confirmCustomTheme is called', () => {
    useAppStore.setState(useAppStore.getInitialState(), true);
    const seedTheme = {
      id: 'theme-a',
      name: 'もとの名前',
      faceTexts: { ...THEME_PRESETS[0].faceTexts },
      faceColors: { ...THEME_PRESETS[0].faceColors },
    };
    useAppStore.setState({
      customThemes: [seedTheme],
      activeThemeId: customThemeActiveId(seedTheme.id),
      draftCustomTheme: null,
    });

    useAppStore.getState().editCustomTheme(seedTheme);
    useAppStore.getState().handleThemeNameChange('編集中の名前');

    expect(useAppStore.getState().customThemes[0]?.name).toBe('もとの名前');
    expect(useAppStore.getState().draftCustomTheme?.name).toBe('編集中の名前');

    useAppStore.getState().confirmCustomTheme();

    const afterConfirm = useAppStore.getState();
    expect(afterConfirm.customThemes).toHaveLength(1);
    expect(afterConfirm.customThemes[0]?.name).toBe('編集中の名前');
    expect(afterConfirm.draftCustomTheme).toBeNull();
    expect(afterConfirm.themeEditorOpen).toBe(false);
  });

  it('discards edits when the editor is closed without confirming', () => {
    useAppStore.setState(useAppStore.getInitialState(), true);
    const seedTheme = {
      id: 'theme-b',
      name: 'キープ',
      faceTexts: { ...THEME_PRESETS[0].faceTexts },
      faceColors: { ...THEME_PRESETS[0].faceColors },
    };
    useAppStore.setState({
      customThemes: [seedTheme],
      activeThemeId: customThemeActiveId(seedTheme.id),
      draftCustomTheme: null,
    });

    useAppStore.getState().editCustomTheme(seedTheme);
    useAppStore.getState().handleThemeNameChange('破棄される名前');
    useAppStore.getState().setThemeEditorOpen(false);

    const state = useAppStore.getState();
    expect(state.customThemes[0]?.name).toBe('キープ');
    expect(state.draftCustomTheme).toBeNull();
    expect(state.themeEditorOpen).toBe(false);
  });

  it('keeps the empty list when stored themes are an empty array even if legacy face data exists', () => {
    useAppStore.setState(useAppStore.getInitialState(), true);

    useAppStore.getState().hydrateFaceDesign(
      [],
      { 1: 'legacy', 2: '', 3: '', 4: '', 5: '', 6: '' },
      { 1: '#111111', 2: '#222222', 3: '#333333', 4: '#444444', 5: '#555555', 6: '#666666' },
    );

    const state = useAppStore.getState();
    expect(state.customThemes).toEqual([]);
    expect(state.activeThemeId).toBe('default');
  });

  it('hydrates stored custom themes and selector names', () => {
    useAppStore.setState(useAppStore.getInitialState(), true);
    const seedTheme = {
      id: 'theme-c',
      name: '保存済み',
      faceTexts: { ...THEME_PRESETS[1].faceTexts },
      faceColors: { ...THEME_PRESETS[1].faceColors },
    };

    useAppStore.getState().hydrateFaceDesign([seedTheme], null, null);

    const state = useAppStore.getState();
    expect(selectActiveCustomTheme(state)).toEqual(seedTheme);
    expect(selectActiveThemeName(state)).toBe('保存済み');
    expect(state.design.faceTexts).toEqual(seedTheme.faceTexts);
  });

  it('selects preset and custom themes', () => {
    useAppStore.setState(useAppStore.getInitialState(), true);
    const customTheme = {
      id: 'theme-d',
      name: 'カスタム',
      faceTexts: { ...THEME_PRESETS[2].faceTexts },
      faceColors: { ...THEME_PRESETS[2].faceColors },
    };
    useAppStore.setState({ customThemes: [customTheme], themeSelectOpen: true });

    useAppStore.getState().selectTheme(THEME_PRESETS[1]);
    expect(useAppStore.getState().activeThemeId).toBe('party');
    expect(useAppStore.getState().themeSelectOpen).toBe(false);
    expect(selectActiveThemeName(useAppStore.getState())).toBe('飲み会トーク');

    useAppStore.setState({ themeSelectOpen: true });
    useAppStore.getState().selectCustomTheme(customTheme);
    expect(useAppStore.getState().activeThemeId).toBe(customThemeActiveId(customTheme.id));
    expect(useAppStore.getState().design.faceTexts).toEqual(customTheme.faceTexts);
  });

  it('opens mutually exclusive panels and simple flags', () => {
    useAppStore.setState(useAppStore.getInitialState(), true);

    useAppStore.getState().setMenuOpen(true);
    useAppStore.getState().openAppSettings();
    expect(useAppStore.getState()).toMatchObject({
      appSettingsOpen: true,
      themeEditorOpen: false,
      debugOpen: false,
      menuOpen: false,
    });

    useAppStore.getState().openThemeSelect();
    expect(useAppStore.getState()).toMatchObject({ themeSelectOpen: true, menuOpen: false });
    useAppStore.getState().openUsage();
    expect(useAppStore.getState()).toMatchObject({ usageOpen: true, menuOpen: false });
    useAppStore.getState().setDebugOpen(true);
    useAppStore.getState().setAppSettingsOpen(false);
    useAppStore.getState().setUsageOpen(false);
    useAppStore.getState().setThemeTab('preset');
    useAppStore.getState().setAudioCueLoaded(true);
    useAppStore.getState().setFaceDesignLoaded(true);
    useAppStore.getState().setAudioCueConfig({ ...DEFAULT_AUDIO_CUE_CONFIG, enabled: true });

    expect(useAppStore.getState()).toMatchObject({
      debugOpen: true,
      appSettingsOpen: false,
      usageOpen: false,
      themeTab: 'preset',
      audioCueLoaded: true,
      faceDesignLoaded: true,
      audioCueConfig: { ...DEFAULT_AUDIO_CUE_CONFIG, enabled: true },
    });
  });

  it('edits existing custom design and ignores edits without an active custom theme', () => {
    useAppStore.setState(useAppStore.getInitialState(), true);
    const customTheme = {
      id: 'theme-e',
      name: '編集対象',
      faceTexts: { ...THEME_PRESETS[0].faceTexts },
      faceColors: { ...THEME_PRESETS[0].faceColors },
    };
    const nextDesign = {
      ...DEFAULT_APP_DESIGN,
      faceTexts: { ...DEFAULT_APP_DESIGN.faceTexts, 1: '変更' },
    };

    useAppStore.getState().handleDesignChange(nextDesign);
    expect(useAppStore.getState().design).toEqual(DEFAULT_APP_DESIGN);

    useAppStore.setState({
      customThemes: [customTheme],
      activeThemeId: customThemeActiveId(customTheme.id),
    });
    useAppStore.getState().handleDesignChange(nextDesign);

    expect(useAppStore.getState().customThemes[0]?.faceTexts[1]).toBe('変更');
    expect(useAppStore.getState().design.faceTexts[1]).toBe('変更');
  });

  it('creates, confirms, and deletes custom themes across active branches', () => {
    useAppStore.setState(useAppStore.getInitialState(), true);

    useAppStore.getState().createCustomTheme();
    expect(useAppStore.getState().draftCustomTheme?.name).toBe('マイテーマ 1');
    useAppStore.getState().handleThemeNameChange('   ');
    useAppStore.getState().confirmCustomTheme();
    expect(useAppStore.getState().customThemes[0]?.name).toBe('マイテーマ 1');

    const firstTheme = useAppStore.getState().customThemes[0];
    if (!firstTheme) throw new Error('missing theme');
    const secondTheme = {
      id: 'theme-f',
      name: '次のテーマ',
      faceTexts: { ...THEME_PRESETS[1].faceTexts },
      faceColors: { ...THEME_PRESETS[1].faceColors },
    };
    useAppStore.setState({
      customThemes: [firstTheme, secondTheme],
      activeThemeId: customThemeActiveId(firstTheme.id),
    });

    useAppStore.getState().deleteCustomTheme({ ...firstTheme, id: 'other' });
    expect(useAppStore.getState().customThemes).toHaveLength(2);

    useAppStore.getState().deleteCustomTheme(firstTheme);
    expect(useAppStore.getState().activeThemeId).toBe(customThemeActiveId(secondTheme.id));

    useAppStore.getState().deleteCustomTheme(secondTheme);
    expect(useAppStore.getState()).toMatchObject({
      customThemes: [],
      activeThemeId: 'default',
      themeEditorOpen: false,
    });
  });

  it('opens design settings only for an active custom theme and applies app settings', () => {
    useAppStore.setState(useAppStore.getInitialState(), true);
    useAppStore.getState().openDesignSettings();
    expect(useAppStore.getState().themeEditorOpen).toBe(false);

    const customTheme = {
      id: 'theme-g',
      name: '編集可',
      faceTexts: { ...THEME_PRESETS[3].faceTexts },
      faceColors: { ...THEME_PRESETS[3].faceColors },
    };
    useAppStore.setState({
      customThemes: [customTheme],
      activeThemeId: customThemeActiveId(customTheme.id),
      menuOpen: true,
    });
    useAppStore.getState().openDesignSettings();
    expect(useAppStore.getState()).toMatchObject({
      themeEditorOpen: true,
      appSettingsOpen: false,
      debugOpen: false,
      menuOpen: false,
    });

    useAppStore.getState().handleAppSettingsChange({ ...DEFAULT_APP_DESIGN, size: 2 });
    expect(useAppStore.getState().design.size).toBe(2);
  });

  it('covers editor open and fallback restore branches', () => {
    useAppStore.setState(useAppStore.getInitialState(), true);
    useAppStore.getState().setThemeEditorOpen(true);
    expect(useAppStore.getState().themeEditorOpen).toBe(true);

    useAppStore.setState({
      activeThemeId: 'missing' as ReturnType<typeof useAppStore.getState>['activeThemeId'],
      draftCustomTheme: {
        id: 'draft',
        name: '下書き',
        faceTexts: DEFAULT_APP_DESIGN.faceTexts,
        faceColors: DEFAULT_APP_DESIGN.faceColors,
      },
    });
    useAppStore.getState().setThemeEditorOpen(false);
    expect(useAppStore.getState().activeThemeId).toBe('missing');
    expect(useAppStore.getState().design.faceTexts).toEqual(THEME_PRESETS[0].faceTexts);

    useAppStore.getState().handleThemeNameChange('ignored');
    expect(useAppStore.getState().customThemes).toEqual([]);
  });
});
