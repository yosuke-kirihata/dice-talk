/** 保存済み音声のメタデータと、再生用に生成した新しい object URL。 */
export interface SavedAudio {
  readonly id: string;
  readonly url: string;
  readonly mimeType: string;
  readonly name: string;
  readonly sizeBytes: number;
}

/** ユーザーが選択した単一の効果音ファイルを扱うストレージ抽象。 */
export interface AudioFileStore {
  save(file: File): Promise<SavedAudio>;
  load(id: string): Promise<SavedAudio | null>;
  delete(id: string): Promise<void>;
}

interface StoredAudioRecord {
  readonly id: string;
  readonly blob: Blob;
  readonly mimeType: string;
  readonly name: string;
  readonly sizeBytes: number;
}

const DB_NAME = 'dice-talk-audio';
const STORE_NAME = 'cues';
const FIXED_KEY = 'audio.cue.v1';
const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/aac',
  'audio/flac',
  'audio/m4a',
  'audio/mp3',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/x-m4a',
]);
const AUDIO_EXTENSION_MIME_TYPES = new Map([
  ['aac', 'audio/aac'],
  ['flac', 'audio/flac'],
  ['m4a', 'audio/x-m4a'],
  ['mp3', 'audio/mpeg'],
  ['ogg', 'audio/ogg'],
  ['wav', 'audio/wav'],
  ['webm', 'audio/webm'],
]);

const getSupportedAudioMimeType = (file: File): string | null => {
  if (ALLOWED_AUDIO_MIME_TYPES.has(file.type)) return file.type;
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension) return null;
  return AUDIO_EXTENSION_MIME_TYPES.get(extension) ?? null;
};

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });

const toSavedAudio = (record: StoredAudioRecord): SavedAudio => ({
  id: record.id,
  url: URL.createObjectURL(record.blob),
  mimeType: record.mimeType,
  name: record.name,
  sizeBytes: record.sizeBytes,
});

/** 現在の効果音ファイルを IndexedDB に保存する AudioFileStore 実装。 */
export class WebAudioFileStore implements AudioFileStore {
  /** 保存済み効果音を置き換え、再生用 object URL 付きのメタデータを返す。 */
  async save(file: File): Promise<SavedAudio> {
    if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
      throw new Error('Audio cue must be 20MB or smaller');
    }
    const mimeType = getSupportedAudioMimeType(file);
    if (!mimeType) {
      throw new Error(`Unsupported audio type: ${file.type || 'unknown'}`);
    }
    const db = await openDb();
    const record: StoredAudioRecord = {
      id: FIXED_KEY,
      blob: file,
      mimeType,
      name: file.name,
      sizeBytes: file.size,
    };
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await requestToPromise(tx.objectStore(STORE_NAME).put(record, FIXED_KEY));
    return toSavedAudio(record);
  }

  /** id に一致する保存済み効果音を読み込む。一致しない id は null を返す。 */
  async load(id: string): Promise<SavedAudio | null> {
    if (id !== FIXED_KEY) return null;
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const record = await requestToPromise<StoredAudioRecord | undefined>(
      tx.objectStore(STORE_NAME).get(FIXED_KEY),
    );
    return record ? toSavedAudio(record) : null;
  }

  /** id が現在の保存キーに一致する場合だけ、保存済み効果音を削除する。 */
  async delete(id: string): Promise<void> {
    if (id !== FIXED_KEY) return;
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await requestToPromise(tx.objectStore(STORE_NAME).delete(FIXED_KEY));
  }
}

import { MAX_AUDIO_FILE_SIZE_BYTES } from '../model/audioFileLimits';
