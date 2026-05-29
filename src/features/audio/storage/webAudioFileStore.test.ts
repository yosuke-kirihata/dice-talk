import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebAudioFileStore } from './webAudioFileStore';

interface StoredValue {
  readonly id: string;
  readonly blob: Blob;
  readonly mimeType: string;
  readonly name: string;
  readonly sizeBytes: number;
}

class RequestMock<T> {
  result!: T;
  error: Error | null = null;
  onsuccess: (() => void) | null = null;
  onerror: (() => void) | null = null;

  succeed(result: T): void {
    this.result = result;
    queueMicrotask(() => this.onsuccess?.());
  }
}

class ObjectStoreMock {
  private readonly db: DbMock;

  constructor(db: DbMock) {
    this.db = db;
  }

  put(value: StoredValue, key: string): RequestMock<void> {
    expect(key).toBe('audio.cue.v1');
    this.db.value = value;
    const request = new RequestMock<void>();
    request.succeed(undefined);
    return request;
  }

  get(key: string): RequestMock<StoredValue | undefined> {
    expect(key).toBe('audio.cue.v1');
    const request = new RequestMock<StoredValue | undefined>();
    request.succeed(this.db.value ?? undefined);
    return request;
  }

  delete(key: string): RequestMock<void> {
    expect(key).toBe('audio.cue.v1');
    this.db.value = null;
    const request = new RequestMock<void>();
    request.succeed(undefined);
    return request;
  }
}

class DbMock {
  value: StoredValue | null = null;
  readonly objectStoreNames = { contains: () => false };
  createObjectStore = vi.fn();

  transaction(): { objectStore: () => ObjectStoreMock } {
    return { objectStore: () => new ObjectStoreMock(this) };
  }
}

const installIndexedDbMock = (db: DbMock) => {
  const open = vi.fn(() => {
    const request = new RequestMock<DbMock>();
    queueMicrotask(() => {
      request.result = db;
      request.onsuccess?.();
    });
    return request;
  });
  vi.stubGlobal('indexedDB', { open });
};

describe('WebAudioFileStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:cue') });
  });

  it('saves one audio file and returns an object URL', async () => {
    const db = new DbMock();
    installIndexedDbMock(db);
    const file = new File(['abc'], 'cue.mp3', { type: 'audio/mpeg' });

    await expect(new WebAudioFileStore().save(file)).resolves.toEqual({
      id: 'audio.cue.v1',
      url: 'blob:cue',
      mimeType: 'audio/mpeg',
      name: 'cue.mp3',
      sizeBytes: 3,
    });
  });

  it('rejects files over 20MB', async () => {
    const db = new DbMock();
    installIndexedDbMock(db);
    const file = new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'big.wav', {
      type: 'audio/wav',
    });

    await expect(new WebAudioFileStore().save(file)).rejects.toThrow('20MB');
  });

  it('rejects files without a supported audio MIME type', async () => {
    const db = new DbMock();
    installIndexedDbMock(db);
    const file = new File(['abc'], 'cue.txt', { type: 'text/plain' });

    await expect(new WebAudioFileStore().save(file)).rejects.toThrow('Unsupported audio type');
  });

  it('accepts iOS files with an empty MIME type when the extension is supported', async () => {
    const db = new DbMock();
    installIndexedDbMock(db);
    const file = new File(['abc'], 'cue.m4a', { type: '' });

    await expect(new WebAudioFileStore().save(file)).resolves.toEqual({
      id: 'audio.cue.v1',
      url: 'blob:cue',
      mimeType: 'audio/x-m4a',
      name: 'cue.m4a',
      sizeBytes: 3,
    });
  });

  it('loads and deletes the fixed cue record', async () => {
    const db = new DbMock();
    installIndexedDbMock(db);
    const store = new WebAudioFileStore();
    const saved = await store.save(new File(['abc'], 'cue.wav', { type: 'audio/wav' }));

    await expect(store.load(saved.id)).resolves.toEqual(saved);
    await store.delete(saved.id);
    await expect(store.load(saved.id)).resolves.toBeNull();
  });
});
