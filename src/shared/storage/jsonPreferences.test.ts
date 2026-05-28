import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadJsonPreference, saveJsonPreference } from './jsonPreferences';

describe('jsonPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and saves string preferences', async () => {
    await saveJsonPreference('key', '{"ok":true}');

    await expect(loadJsonPreference('key')).resolves.toBe('{"ok":true}');
  });

  it('returns null for missing preferences', async () => {
    await expect(loadJsonPreference('missing')).resolves.toBeNull();
  });

  it('throws a descriptive error when storage quota is exceeded', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });

    await expect(saveJsonPreference('key', 'value')).rejects.toThrow(
      'Storage quota exceeded while saving key',
    );
  });

  it('throws a generic save error for other storage failures', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    await expect(saveJsonPreference('key', 'value')).rejects.toThrow('Failed to save key');
  });
});
