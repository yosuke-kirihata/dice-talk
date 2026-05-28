import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isDebugMockEnabled } from './debugFlags';

const originalLocation = window.location;

const setSearch = (search: string): void => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...originalLocation, search },
  });
};

describe('debugFlags', () => {
  beforeEach(() => {
    setSearch('');
  });
  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('isDebugMockEnabled returns true when ?debugMock=1 is in the search', () => {
    setSearch('?debugMock=1');
    expect(isDebugMockEnabled()).toBe(true);
  });

  it('isDebugMockEnabled returns false when only ?debug=1 is set', () => {
    setSearch('?debug=1');
    expect(isDebugMockEnabled()).toBe(false);
  });

  it('isDebugMockEnabled returns false when no query is set', () => {
    setSearch('');
    expect(isDebugMockEnabled()).toBe(false);
  });
});
