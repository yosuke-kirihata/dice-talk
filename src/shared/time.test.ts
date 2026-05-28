import { afterEach, describe, expect, it, vi } from 'vitest';
import { nowMs } from './time';

describe('nowMs', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to Date.now when performance is unavailable', () => {
    vi.stubGlobal('performance', undefined);
    vi.spyOn(Date, 'now').mockReturnValue(123);
    expect(nowMs()).toBe(123);
  });
});
