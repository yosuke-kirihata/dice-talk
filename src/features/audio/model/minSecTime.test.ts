import { describe, expect, it } from 'vitest';
import { formatMinSec, parseMinSec } from './minSecTime';

describe('formatMinSec', () => {
  it('formats integer seconds as m:ss', () => {
    expect(formatMinSec(0)).toBe('0:00');
    expect(formatMinSec(3)).toBe('0:03');
    expect(formatMinSec(59)).toBe('0:59');
    expect(formatMinSec(60)).toBe('1:00');
    expect(formatMinSec(90)).toBe('1:30');
  });

  it('keeps tenths precision when seconds are not integral', () => {
    expect(formatMinSec(3.5)).toBe('0:03.5');
    expect(formatMinSec(90.4)).toBe('1:30.4');
  });

  it('treats negative or non-finite values as zero', () => {
    expect(formatMinSec(-10)).toBe('0:00');
    expect(formatMinSec(Number.NaN)).toBe('0:00');
    expect(formatMinSec(Number.POSITIVE_INFINITY)).toBe('0:00');
  });
});

describe('parseMinSec', () => {
  it('parses m:ss and m:ss.s', () => {
    expect(parseMinSec('0:00')).toBe(0);
    expect(parseMinSec('1:30')).toBe(90);
    expect(parseMinSec('0:03.5')).toBe(3.5);
    expect(parseMinSec(' 2:05 ')).toBe(125);
  });

  it('parses plain seconds without a colon', () => {
    expect(parseMinSec('3')).toBe(3);
    expect(parseMinSec('3.5')).toBe(3.5);
  });

  it('returns null for invalid input', () => {
    expect(parseMinSec('')).toBeNull();
    expect(parseMinSec('abc')).toBeNull();
    expect(parseMinSec('1:60')).toBeNull();
    expect(parseMinSec('-1:30')).toBeNull();
    expect(parseMinSec('1:2:3')).toBeNull();
    expect(parseMinSec('1:ab')).toBeNull();
  });
});
