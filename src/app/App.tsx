import { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { type CustomTheme, DiceCanvas } from '@/features/dice';
import { LicenseDialog } from '@/features/licenses';
import { TouchInputLayer } from '@/features/pose';
import { ThemeSelectDialog } from '@/features/theme';
import { UsageDialog } from '@/features/usage';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AppChrome } from './components/AppChrome';
import { AppSheets } from './components/AppSheets';
import { selectActiveCustomTheme, selectActiveThemeName, useAppStore } from '@/store/appStore';
import { SideMenu } from './components/SideMenu';
import { useAudioCuePersistence, useFaceDesignPersistence } from '@/hooks/useAppPersistence';
import {
  playAudioCue,
  useAppPoseSources,
  useDebugMockSource,
  useSceneOptions,
} from '@/hooks/useAppScene';
import { useAppServices } from '@/hooks/useAppServices';
import { useCtaSpin } from '@/hooks/useCtaSpin';
import './App.css';

const App = (): React.JSX.Element => {
  const [licenseOpen, setLicenseOpen] = useState(false);
  const [deleteTargetTheme, setDeleteTargetTheme] = useState<CustomTheme | null>(null);
  const { touchSource, audioFileStore, audioCuePlayer, debugMockEnabled, debugMockSource } =
    useAppServices();

  const design = useAppStore((s) => s.design);
  const customThemes = useAppStore((s) => s.customThemes);
  const faceDesignLoaded = useAppStore((s) => s.faceDesignLoaded);
  const audioCueConfig = useAppStore((s) => s.audioCueConfig);
  const audioCueLoaded = useAppStore((s) => s.audioCueLoaded);
  const {
    themeEditorOpen,
    draftCustomTheme,
    appSettingsOpen,
    debugOpen,
    menuOpen,
    usageOpen,
    themeSelectOpen,
    themeTab,
    activeThemeId,
  } = useAppStore(
    useShallow((s) => ({
      themeEditorOpen: s.themeEditorOpen,
      draftCustomTheme: s.draftCustomTheme,
      appSettingsOpen: s.appSettingsOpen,
      debugOpen: s.debugOpen,
      menuOpen: s.menuOpen,
      usageOpen: s.usageOpen,
      themeSelectOpen: s.themeSelectOpen,
      themeTab: s.themeTab,
      activeThemeId: s.activeThemeId,
    })),
  );
  const {
    hydrateFaceDesign,
    setFaceDesignLoaded,
    setAudioCueConfig,
    setAudioCueLoaded,
    setMenuOpen,
    setUsageOpen,
    setThemeSelectOpen,
    setThemeTab,
    setAppSettingsOpen,
    setDebugOpen,
    openAppSettings,
    openDesignSettings,
    openThemeSelect,
    openUsage,
    selectTheme,
    selectCustomTheme,
    editCustomTheme,
    deleteCustomTheme,
    createCustomTheme,
    setThemeEditorOpen,
    handleDesignChange,
    handleThemeNameChange,
    handleAppSettingsChange,
    confirmCustomTheme,
  } = useAppStore(
    useShallow((s) => ({
      hydrateFaceDesign: s.hydrateFaceDesign,
      setFaceDesignLoaded: s.setFaceDesignLoaded,
      setAudioCueConfig: s.setAudioCueConfig,
      setAudioCueLoaded: s.setAudioCueLoaded,
      setMenuOpen: s.setMenuOpen,
      setUsageOpen: s.setUsageOpen,
      setThemeSelectOpen: s.setThemeSelectOpen,
      setThemeTab: s.setThemeTab,
      setAppSettingsOpen: s.setAppSettingsOpen,
      setDebugOpen: s.setDebugOpen,
      openAppSettings: s.openAppSettings,
      openDesignSettings: s.openDesignSettings,
      openThemeSelect: s.openThemeSelect,
      openUsage: s.openUsage,
      selectTheme: s.selectTheme,
      selectCustomTheme: s.selectCustomTheme,
      editCustomTheme: s.editCustomTheme,
      deleteCustomTheme: s.deleteCustomTheme,
      createCustomTheme: s.createCustomTheme,
      setThemeEditorOpen: s.setThemeEditorOpen,
      handleDesignChange: s.handleDesignChange,
      handleThemeNameChange: s.handleThemeNameChange,
      handleAppSettingsChange: s.handleAppSettingsChange,
      confirmCustomTheme: s.confirmCustomTheme,
    })),
  );
  const activeCustomTheme = useAppStore(selectActiveCustomTheme);
  const activeThemeName = useAppStore(selectActiveThemeName);

  useFaceDesignPersistence({
    customThemes,
    faceDesignLoaded,
    hydrateFaceDesign,
    setFaceDesignLoaded,
  });
  useAudioCuePersistence({
    audioCueConfig,
    audioCueLoaded,
    audioFileStore,
    audioCuePlayer,
    setAudioCueConfig,
    setAudioCueLoaded,
  });
  useDebugMockSource(debugMockSource);

  const { poseSource, debugSource } = useAppPoseSources(touchSource, debugMockSource);
  const sceneOptions = useSceneOptions(design);
  const { onCtaPointerDown, onCtaPointerMove, onCtaPointerUp } = useCtaSpin({
    touchSource,
    spinConfig: design.spin,
    audioEnabled: audioCueConfig.enabled,
    audioCuePlayer,
  });

  const handleDeleteCustomTheme = useCallback((theme: Parameters<typeof deleteCustomTheme>[0]) => {
    setDeleteTargetTheme(theme);
  }, []);

  const confirmDeleteCustomTheme = useCallback(() => {
    if (!deleteTargetTheme) return;
    deleteCustomTheme(deleteTargetTheme);
    setDeleteTargetTheme(null);
  }, [deleteCustomTheme, deleteTargetTheme]);

  return (
    <div className="app-root">
      <DiceCanvas poseSource={poseSource} className="dice-canvas" sceneOptions={sceneOptions} />
      <TouchInputLayer
        source={touchSource}
        spinConfig={design.spin}
        onSpinStart={() => {
          playAudioCue(audioCueConfig.enabled, audioCuePlayer);
        }}
        className="touch-input-layer"
      />

      <AppChrome
        menuOpen={menuOpen}
        activeThemeName={activeThemeName}
        canEditActiveTheme={activeCustomTheme !== undefined}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenThemeSelect={openThemeSelect}
        onOpenDesignSettings={openDesignSettings}
        onCtaPointerDown={onCtaPointerDown}
        onCtaPointerMove={onCtaPointerMove}
        onCtaPointerUp={onCtaPointerUp}
      />
      <SideMenu
        open={menuOpen}
        canEditActiveTheme={activeCustomTheme !== undefined}
        onClose={() => setMenuOpen(false)}
        onOpenDesignSettings={openDesignSettings}
        onOpenThemeSelect={openThemeSelect}
        onOpenAppSettings={openAppSettings}
        onOpenUsage={openUsage}
        onOpenLicenses={() => {
          setMenuOpen(false);
          setLicenseOpen(true);
        }}
      />
      <UsageDialog open={usageOpen} onClose={() => setUsageOpen(false)} />
      <LicenseDialog open={licenseOpen} onClose={() => setLicenseOpen(false)} />
      <ConfirmDialog
        open={deleteTargetTheme !== null}
        title="テーマを削除"
        message={`${deleteTargetTheme?.name ?? ''}を削除しますか？`}
        confirmLabel="削除"
        onCancel={() => setDeleteTargetTheme(null)}
        onConfirm={confirmDeleteCustomTheme}
      />
      <ThemeSelectDialog
        open={themeSelectOpen}
        themeTab={themeTab}
        customThemes={customThemes}
        activeThemeId={activeThemeId}
        onClose={() => setThemeSelectOpen(false)}
        onThemeTabChange={setThemeTab}
        onSelectTheme={selectTheme}
        onSelectCustomTheme={selectCustomTheme}
        onEditCustomTheme={editCustomTheme}
        onDeleteCustomTheme={handleDeleteCustomTheme}
        onCreateCustomTheme={createCustomTheme}
      />
      <AppSheets
        poseSource={debugSource}
        design={design}
        draftCustomTheme={draftCustomTheme}
        customThemes={customThemes}
        activeCustomTheme={activeCustomTheme}
        themeEditorOpen={themeEditorOpen}
        appSettingsOpen={appSettingsOpen}
        debugOpen={debugOpen}
        debugMockEnabled={debugMockEnabled}
        audioCueConfig={audioCueConfig}
        audioFileStore={audioFileStore}
        audioCuePlayer={audioCuePlayer}
        onDesignChange={handleDesignChange}
        onThemeNameChange={handleThemeNameChange}
        onCloseThemeEditor={setThemeEditorOpen}
        onConfirmCustomTheme={confirmCustomTheme}
        onAppSettingsChange={handleAppSettingsChange}
        onAudioCueConfigChange={setAudioCueConfig}
        onAppSettingsOpenChange={setAppSettingsOpen}
        onDebugOpenChange={setDebugOpen}
      />
    </div>
  );
};

export default App;
