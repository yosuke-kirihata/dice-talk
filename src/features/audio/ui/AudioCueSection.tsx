import { useCallback, useEffect, useRef, useState } from 'react';
import { type AudioCueConfig, validateAudioCueConfig } from '../model/audioCueConfig';
import { MAX_AUDIO_FILE_SIZE_BYTES } from '../model/audioFileLimits';
import { formatMinSec, parseMinSec } from '../model/minSecTime';
import type { AudioCuePlayer } from '../player/audioCuePlayer';
import type { AudioFileStore, SavedAudio } from '../storage/webAudioFileStore';

/** 動作設定パネル内に表示する、効果音編集セクションの props。 */
export interface AudioCueSectionProps {
  readonly config: AudioCueConfig;
  readonly onConfigChange: (next: AudioCueConfig) => void;
  readonly audioFileStore: AudioFileStore;
  readonly audioCuePlayer: AudioCuePlayer;
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

/** 効果音ファイルの選択、切り出し、有効化、プレビューを行う UI。 */
export const AudioCueSection = ({
  config,
  onConfigChange,
  audioFileStore,
  audioCuePlayer,
}: AudioCueSectionProps): React.JSX.Element => {
  const [savedAudio, setSavedAudio] = useState<SavedAudio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startText, setStartText] = useState(() => formatMinSec(config.startSec));
  const [endText, setEndText] = useState(() => formatMinSec(config.endSec));
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const savedAudioRef = useRef<SavedAudio | null>(null);

  const updateSavedAudio = useCallback((next: SavedAudio | null) => {
    savedAudioRef.current = next;
    setSavedAudio(next);
  }, []);

  useEffect(() => {
    setStartText(formatMinSec(config.startSec));
  }, [config.startSec]);
  useEffect(() => {
    setEndText(formatMinSec(config.endSec));
  }, [config.endSec]);
  useEffect(() => {
    if (!config.sourceId) {
      updateSavedAudio(null);
      return;
    }
    if (savedAudioRef.current?.id !== config.sourceId) updateSavedAudio(null);
    let active = true;
    void audioFileStore
      .load(config.sourceId)
      .then((saved) => {
        if (active && saved) updateSavedAudio(saved);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [config.sourceId, audioFileStore, updateSavedAudio]);

  const commit = (patch: Partial<AudioCueConfig>) => {
    onConfigChange(validateAudioCueConfig({ ...config, ...patch }));
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
      setError('音声ファイルは20MB以下にしてください。');
      return;
    }
    setError(null);
    try {
      const saved = await audioFileStore.save(file);
      updateSavedAudio(saved);
      const next = validateAudioCueConfig({ ...config, sourceId: saved.id });
      await audioCuePlayer.prepare(saved.url, next);
      onConfigChange(next);
    } catch {
      updateSavedAudio(null);
      setError('音声ファイルを保存できませんでした。');
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    commit({ volume: Number.parseFloat(e.target.value) });
  };

  const handleStartBlur = () => {
    const parsed = parseMinSec(startText);
    if (parsed === null) {
      setStartText(formatMinSec(config.startSec));
      return;
    }
    commit({ startSec: parsed });
  };

  const handleEndBlur = () => {
    const parsed = parseMinSec(endText);
    if (parsed === null) {
      setEndText(formatMinSec(config.endSec));
      return;
    }
    commit({ endSec: parsed });
  };

  const handleDelete = async () => {
    if (!config.sourceId) return;
    setError(null);
    try {
      await audioFileStore.delete(config.sourceId);
      audioCuePlayer.unload();
      updateSavedAudio(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onConfigChange(
        validateAudioCueConfig({
          ...config,
          sourceId: null,
          enabled: false,
          startSec: 0,
          endSec: 0,
        }),
      );
    } catch {
      setError('効果音を削除できませんでした。');
    }
  };

  return (
    <div className="design-panel__section audio-cue">
      <div className="design-panel__heading">効果音</div>
      <div className="audio-cue__file">
        <label htmlFor="audio-cue-file" className="design-panel__label">
          <span>音声ファイル</span>
        </label>
        <input
          id="audio-cue-file"
          ref={fileInputRef}
          type="file"
          accept=".aac,.flac,.m4a,.mp3,.ogg,.wav,.webm,audio/aac,audio/flac,audio/m4a,audio/mp3,audio/mp4,audio/mpeg,audio/ogg,audio/wav,audio/webm,audio/x-m4a"
          aria-label="音声ファイル"
          onChange={handleFile}
          className="audio-cue__file-input"
        />
        {savedAudio ? (
          <div className="audio-cue__file-info">
            <span>{savedAudio.name}</span>
            <span>{formatSize(savedAudio.sizeBytes)}</span>
          </div>
        ) : null}
        {error ? <div className="audio-cue__error">{error}</div> : null}
      </div>

      <div className="design-panel__toggles audio-cue__toggle">
        <label>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => commit({ enabled: e.target.checked })}
            aria-label="効果音 有効"
            className="design-panel__checkbox"
          />
          有効
        </label>
      </div>

      <div className="design-panel__pair">
        <label>
          <span>開始 (分:秒)</span>
          <input
            type="text"
            inputMode="numeric"
            value={startText}
            onChange={(e) => setStartText(e.target.value)}
            onBlur={handleStartBlur}
            aria-label="音声 開始位置"
            placeholder="0:00"
            className="design-panel__input"
          />
        </label>
        <label>
          <span>終了 (分:秒)</span>
          <input
            type="text"
            inputMode="numeric"
            value={endText}
            onChange={(e) => setEndText(e.target.value)}
            onBlur={handleEndBlur}
            aria-label="音声 終了位置"
            placeholder="0:03"
            className="design-panel__input"
          />
        </label>
      </div>

      <label className="design-panel__label" htmlFor="audio-cue-volume">
        <span>音量</span>
        <span>{(config.volume * 100).toFixed(0)}%</span>
      </label>
      <input
        id="audio-cue-volume"
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={config.volume}
        onChange={handleVolume}
        aria-label="音声音量"
        className="design-panel__range"
      />

      <div className="audio-cue__actions">
        <button
          type="button"
          onClick={() => audioCuePlayer.play()}
          disabled={!config.sourceId}
          className="audio-cue__preview"
        >
          試聴
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={!config.sourceId}
          className="design-panel__delete"
        >
          削除
        </button>
      </div>
    </div>
  );
};
