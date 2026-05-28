import { describe, expect, it } from 'vitest';
import { type Quat, toThree } from '@/shared/pose';
import { fromAxisAngle, identity, multiply, normalize, slerp, toYawPitchRoll } from './quaternion';

describe('quaternion / identity', () => {
  it('returns [0, 0, 0, 1]', () => {
    expect(identity()).toEqual([0, 0, 0, 1]);
  });
});

describe('quaternion / multiply', () => {
  const q: Quat = [0.1, 0.2, 0.3, Math.sqrt(1 - 0.14)];

  it('identity * q === q', () => {
    expect(multiply(identity(), q)).toEqual(q);
  });

  it('q * identity === q', () => {
    const got = multiply(q, identity());
    for (let i = 0; i < 4; i++) {
      expect(got[i] ?? Number.NaN).toBeCloseTo(q[i] ?? Number.NaN, 12);
    }
  });

  it('does not mutate inputs', () => {
    const a: Quat = [0.1, 0.2, 0.3, 0.9];
    const b: Quat = [0.4, 0.5, 0.6, 0.7];
    const aCopy: Quat = [...a];
    const bCopy: Quat = [...b];
    multiply(a, b);
    expect(a).toEqual(aCopy);
    expect(b).toEqual(bCopy);
  });
});

describe('quaternion / normalize', () => {
  it('scales [2,0,0,0] to [1,0,0,0]', () => {
    expect(normalize([2, 0, 0, 0])).toEqual([1, 0, 0, 0]);
  });

  it('falls back to identity for a zero quaternion', () => {
    expect(normalize([0, 0, 0, 0])).toEqual([0, 0, 0, 1]);
  });
});

describe('quaternion / fromAxisAngle', () => {
  it('zero angle returns identity for any axis', () => {
    expect(fromAxisAngle([1, 0, 0], 0)).toEqual([0, 0, 0, 1]);
  });

  it('zero axis returns identity', () => {
    expect(fromAxisAngle([0, 0, 0], Math.PI / 2)).toEqual([0, 0, 0, 1]);
  });

  it('180° around X is approximately [1,0,0,0]', () => {
    const q = fromAxisAngle([1, 0, 0], Math.PI);
    expect(q[0]).toBeCloseTo(1, 9);
    expect(q[1]).toBeCloseTo(0, 9);
    expect(q[2]).toBeCloseTo(0, 9);
    expect(q[3]).toBeCloseTo(0, 9);
  });

  it('produces unit-length quaternion for arbitrary inputs', () => {
    const q = fromAxisAngle([0.3, -0.7, 0.2], 1.234);
    expect(Math.hypot(...q)).toBeCloseTo(1, 9);
  });
});

describe('quaternion / slerp', () => {
  const a: Quat = [0, 0, 0, 1];
  const b = fromAxisAngle([0, 1, 0], Math.PI / 2);

  it('t=0 returns a', () => {
    expect(slerp(a, b, 0)).toEqual(a);
  });

  it('t=1 returns b', () => {
    const got = slerp(a, b, 1);
    for (let i = 0; i < 4; i++) {
      expect(got[i] ?? Number.NaN).toBeCloseTo(b[i] ?? Number.NaN, 9);
    }
  });

  it('t=0.5 between identity and 90°Y is 45°Y (true spherical interpolation)', () => {
    const got = slerp(a, b, 0.5);
    const expected = fromAxisAngle([0, 1, 0], Math.PI / 4);
    for (let i = 0; i < 4; i++) {
      expect(got[i] ?? Number.NaN).toBeCloseTo(expected[i] ?? Number.NaN, 9);
    }
  });

  it('uses the shortest path when quaternions have negative dot product', () => {
    const target: Quat = [0, 0, 0, -1];
    expect(slerp(a, target, 0.5)).toEqual(a);
  });

  it('normalizes the linear path for nearly identical quaternions', () => {
    const near = normalize([0.001, 0, 0, 0.9999995]);
    const got = slerp(a, near, 0.5);
    expect(Math.hypot(...got)).toBeCloseTo(1, 12);
    expect(got[0]).toBeGreaterThan(0);
  });
});

describe('quaternion / toYawPitchRoll', () => {
  it('identity returns zero yaw/pitch/roll', () => {
    const r = toYawPitchRoll([0, 0, 0, 1]);
    expect(r.yaw).toBeCloseTo(0, 9);
    expect(r.pitch).toBeCloseTo(0, 9);
    expect(r.roll).toBeCloseTo(0, 9);
  });

  it('90 deg around Y → yaw=90, pitch=0, roll=0', () => {
    const q = fromAxisAngle([0, 1, 0], Math.PI / 2);
    const r = toYawPitchRoll(q);
    expect(r.yaw).toBeCloseTo(90, 6);
    expect(r.pitch).toBeCloseTo(0, 6);
    expect(r.roll).toBeCloseTo(0, 6);
  });

  it('45 deg around X → pitch=45, yaw=0, roll=0', () => {
    const q = fromAxisAngle([1, 0, 0], Math.PI / 4);
    const r = toYawPitchRoll(q);
    expect(r.yaw).toBeCloseTo(0, 6);
    expect(r.pitch).toBeCloseTo(45, 6);
    expect(r.roll).toBeCloseTo(0, 6);
  });

  it('60 deg around Z → roll=60, yaw=0, pitch=0', () => {
    const q = fromAxisAngle([0, 0, 1], Math.PI / 3);
    const r = toYawPitchRoll(q);
    expect(r.yaw).toBeCloseTo(0, 6);
    expect(r.pitch).toBeCloseTo(0, 6);
    expect(r.roll).toBeCloseTo(60, 6);
  });
});

describe('quaternion / toThree', () => {
  it('maps [x,y,z,w] tuple to THREE.Quaternion of same components', () => {
    const q: Quat = [0.1, -0.2, 0.3, 0.927];
    const t = toThree(q);
    expect(t.x).toBeCloseTo(0.1, 9);
    expect(t.y).toBeCloseTo(-0.2, 9);
    expect(t.z).toBeCloseTo(0.3, 9);
    expect(t.w).toBeCloseTo(0.927, 9);
  });
});
