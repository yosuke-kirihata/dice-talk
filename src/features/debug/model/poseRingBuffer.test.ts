import { describe, expect, it } from 'vitest';
import { PoseRingBuffer } from './poseRingBuffer';

describe('PoseRingBuffer', () => {
  it('starts empty with the given capacity and series count', () => {
    const buf = new PoseRingBuffer(8, 4);
    expect(buf.capacity).toBe(8);
    expect(buf.seriesCount).toBe(4);
    expect(buf.size).toBe(0);
    const v = buf.view();
    expect(v.ts.length).toBe(0);
    expect(v.series).toHaveLength(4);
    expect(v.series[0]?.length).toBe(0);
  });

  it('rejects invalid construction parameters', () => {
    expect(() => new PoseRingBuffer(0, 4)).toThrow();
    expect(() => new PoseRingBuffer(8, 0)).toThrow();
    expect(() => new PoseRingBuffer(-1, 4)).toThrow();
  });

  it('push appends in chronological order until capacity', () => {
    const buf = new PoseRingBuffer(4, 2);
    buf.push(10, [1, -1]);
    buf.push(20, [2, -2]);
    buf.push(30, [3, -3]);
    expect(buf.size).toBe(3);
    const v = buf.view();
    expect(Array.from(v.ts)).toEqual([10, 20, 30]);
    expect(Array.from(v.series[0] ?? [])).toEqual([1, 2, 3]);
    expect(Array.from(v.series[1] ?? [])).toEqual([-1, -2, -3]);
  });

  it('push wraps and keeps only the latest `capacity` samples in chronological order', () => {
    const buf = new PoseRingBuffer(3, 1);
    buf.push(10, [1]);
    buf.push(20, [2]);
    buf.push(30, [3]);
    buf.push(40, [4]);
    buf.push(50, [5]);
    expect(buf.size).toBe(3);
    const v = buf.view();
    expect(Array.from(v.ts)).toEqual([30, 40, 50]);
    expect(Array.from(v.series[0] ?? [])).toEqual([3, 4, 5]);
  });

  it('throws when push receives the wrong number of values', () => {
    const buf = new PoseRingBuffer(4, 3);
    expect(() => buf.push(0, [1, 2])).toThrow();
    expect(() => buf.push(0, [1, 2, 3, 4])).toThrow();
  });

  it('clear empties the buffer but preserves capacity / seriesCount', () => {
    const buf = new PoseRingBuffer(4, 2);
    buf.push(10, [1, 2]);
    buf.push(20, [3, 4]);
    buf.clear();
    expect(buf.size).toBe(0);
    expect(buf.capacity).toBe(4);
    expect(buf.seriesCount).toBe(2);
    const v = buf.view();
    expect(v.ts.length).toBe(0);
    expect(v.series[0]?.length).toBe(0);
  });

  it('view returns fresh copies that do not alias internal storage', () => {
    const buf = new PoseRingBuffer(4, 1);
    buf.push(10, [1]);
    const v1 = buf.view();
    buf.push(20, [2]);
    expect(Array.from(v1.ts)).toEqual([10]);
    expect(Array.from(v1.series[0] ?? [])).toEqual([1]);
  });

  it('viewSince returns samples at or after the given timestamp', () => {
    const buf = new PoseRingBuffer(5, 2);
    buf.push(10, [1, -1]);
    buf.push(20, [2, -2]);
    buf.push(30, [3, -3]);

    const v = buf.viewSince(20);
    expect(Array.from(v.ts)).toEqual([20, 30]);
    expect(Array.from(v.series[0] ?? [])).toEqual([2, 3]);
    expect(Array.from(v.series[1] ?? [])).toEqual([-2, -3]);
  });
});
