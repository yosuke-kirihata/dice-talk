import { describe, expect, it } from 'vitest';
import { fromAxisAngle } from '@/features/pose/lib/quaternion';
import type { PoseSnapshot } from '@/shared/pose';
import { EULER_SERIES, getSeriesDef, QUAT_SERIES, SERIES_KINDS } from './seriesAdapter';

const snap = (q: PoseSnapshot['quat']): PoseSnapshot => ({ quat: q, timestamp: 0 });

describe('seriesAdapter', () => {
  describe('QUAT_SERIES', () => {
    it('has 4 series with x/y/z/w labels', () => {
      expect(QUAT_SERIES.count).toBe(4);
      expect(QUAT_SERIES.labels).toEqual(['x', 'y', 'z', 'w']);
      expect(QUAT_SERIES.colors).toHaveLength(4);
    });

    it('toValues returns the quaternion components in order', () => {
      expect(QUAT_SERIES.toValues(snap([0.1, -0.2, 0.3, 0.9]))).toEqual([0.1, -0.2, 0.3, 0.9]);
    });
  });

  describe('EULER_SERIES', () => {
    it('has 3 series with yaw/pitch/roll labels', () => {
      expect(EULER_SERIES.count).toBe(3);
      expect(EULER_SERIES.labels).toEqual(['yaw', 'pitch', 'roll']);
      expect(EULER_SERIES.colors).toHaveLength(3);
    });

    it('returns [0, 0, 0] for the identity quaternion', () => {
      const v = EULER_SERIES.toValues(snap([0, 0, 0, 1]));
      expect(v[0]).toBeCloseTo(0, 6);
      expect(v[1]).toBeCloseTo(0, 6);
      expect(v[2]).toBeCloseTo(0, 6);
    });

    it('returns ~90° yaw for a 90° rotation around the Y axis', () => {
      const q = fromAxisAngle([0, 1, 0], Math.PI / 2);
      const [yaw, pitch, roll] = EULER_SERIES.toValues(snap(q));
      expect(yaw).toBeCloseTo(90, 1);
      expect(pitch).toBeCloseTo(0, 1);
      expect(roll).toBeCloseTo(0, 1);
    });
  });

  it('getSeriesDef returns the correct def for each kind', () => {
    expect(getSeriesDef('quat')).toBe(QUAT_SERIES);
    expect(getSeriesDef('euler')).toBe(EULER_SERIES);
  });

  it('SERIES_KINDS lists every kind exactly once', () => {
    expect(SERIES_KINDS).toEqual(['quat', 'euler']);
  });
});
