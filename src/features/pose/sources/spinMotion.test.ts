import { describe, expect, it } from 'vitest';
import { FACE_ORIENTATIONS, FRONT_DIRECTION } from '@/shared/dice';
import type { Quat } from '@/shared/pose';
import {
  DEFAULT_SPIN_CONFIG,
  getFrontMostPip,
  getTargetQuatForPip,
  interpolateSpinSpeed,
  pickTargetPip,
  startSpinMotion,
  stepSpinMotion,
} from './spinMotion';

const rotateVector = (
  q: Quat,
  v: readonly [number, number, number],
): readonly [number, number, number] => {
  const [x, y, z, w] = q;
  const [vx, vy, vz] = v;
  const tx = 2 * (y * vz - z * vy);
  const ty = 2 * (z * vx - x * vz);
  const tz = 2 * (x * vy - y * vx);
  return [
    vx + w * tx + (y * tz - z * ty),
    vy + w * ty + (z * tx - x * tz),
    vz + w * tz + (x * ty - y * tx),
  ];
};

describe('spinMotion', () => {
  it('interpolates speed table linearly', () => {
    expect(
      interpolateSpinSpeed(
        [
          { at: 0, speed: 40 },
          { at: 0.5, speed: 20 },
          { at: 1, speed: 0 },
        ],
        0.25,
      ),
    ).toBeCloseTo(30);
  });

  it('honors deterministic pip weights', () => {
    expect(pickTargetPip([0, 0, 1, 0, 0, 0], 123)).toBe(3);
    expect(pickTargetPip([0, 0, 0, 0, 0, 0], 123)).toBe(3);
  });

  it('supports custom targets and missing target fallbacks', () => {
    const targets = [
      { id: 10, normal: [0, 0, 1] },
      { id: 20, normal: [0, 1, 0] },
    ] as const;

    expect(pickTargetPip([0, 1, 0, 0, 0, 0], 123, targets)).toBe(20);
    expect(getTargetQuatForPip(999, targets)).toEqual([0, 0, 0, 1]);
    expect(getFrontMostPip([0, 0, 0, 1], targets)).toBe(10);
  });

  it('adds deterministic per-spin variation from the seed', () => {
    const a = startSpinMotion([0, 0, 0, 1], DEFAULT_SPIN_CONFIG, 1000, 10);
    const b = startSpinMotion([0, 0, 0, 1], DEFAULT_SPIN_CONFIG, 1000, 11);
    const again = startSpinMotion([0, 0, 0, 1], DEFAULT_SPIN_CONFIG, 1000, 10);

    expect(a.variation).toEqual(again.variation);
    expect(a.variation).not.toEqual(b.variation);
    expect(a.variation.durationMs).not.toBe(DEFAULT_SPIN_CONFIG.durationMs);
    expect(a.variation.settleMs).not.toBe(DEFAULT_SPIN_CONFIG.settleMs);
    expect(a.variation.speedScale).not.toBe(1);
  });

  it('maps every pip face normal to the front direction', () => {
    for (const face of FACE_ORIENTATIONS) {
      const rotated = rotateVector(getTargetQuatForPip(face.pip), face.normal);
      expect(rotated[0]).toBeCloseTo(FRONT_DIRECTION[0], 6);
      expect(rotated[1]).toBeCloseTo(FRONT_DIRECTION[1], 6);
      expect(rotated[2]).toBeCloseTo(FRONT_DIRECTION[2], 6);
    }
  });

  it('settles exactly on the selected target quat after the motion ends', () => {
    const config = { ...DEFAULT_SPIN_CONFIG, pipWeights: [0, 0, 0, 1, 0, 0] } as const;
    const state = startSpinMotion([0, 0, 0, 1], config, 1000, 42);
    expect(state.targetPip).toBe(4);

    const stepped = stepSpinMotion(
      state,
      config,
      1000 +
        state.variation.durationMs +
        state.variation.settleMs +
        (config.confirmMs ?? DEFAULT_SPIN_CONFIG.confirmMs ?? 0) +
        1,
    );

    expect(stepped.done).toBe(true);
    expect(stepped.state.quat).toEqual(state.targetQuat);
  });

  it('rocks slowly after settling before completing the result pose', () => {
    const config = {
      ...DEFAULT_SPIN_CONFIG,
      confirmMs: 3000,
      pipWeights: [0, 0, 1, 0, 0, 0],
    } as const;
    const state = startSpinMotion([0, 0, 0, 1], config, 1000, 42);
    const confirmStart = 1000 + state.variation.durationMs + state.variation.settleMs;
    const rocking = stepSpinMotion(state, config, confirmStart + config.confirmMs / 12);
    const done = stepSpinMotion(state, config, confirmStart + config.confirmMs + 1);

    expect(rocking.done).toBe(false);
    expect(rocking.state.quat).not.toEqual(state.targetQuat);
    expect(done.done).toBe(true);
    expect(done.state.quat).toEqual(state.targetQuat);
  });

  it('uses the front-most pip at settle start as the final result', () => {
    const config = { ...DEFAULT_SPIN_CONFIG, pipWeights: [0, 0, 0, 1, 0, 0] } as const;
    const spinEndQuat = getTargetQuatForPip(2);
    const state = startSpinMotion(spinEndQuat, config, 1000, 42);
    const atSettleStart = stepSpinMotion(state, config, 1000 + state.variation.durationMs);

    expect(getFrontMostPip(spinEndQuat)).toBe(2);
    expect(atSettleStart.state.targetPip).toBe(2);
    expect(atSettleStart.state.targetQuat).toEqual(getTargetQuatForPip(2));
  });

  it('ends with the forced target pip facing front for every pip', () => {
    for (const pip of [1, 2, 3, 4, 5, 6] as const) {
      const weights = [0, 0, 0, 0, 0, 0] as [number, number, number, number, number, number];
      weights[pip - 1] = 1;
      const config = { ...DEFAULT_SPIN_CONFIG, pipWeights: weights };
      const state = startSpinMotion([0.2, 0.3, 0.1, 0.9273618495495703], config, 1000, 42);
      const stepped = stepSpinMotion(
        state,
        config,
        1000 +
          state.variation.durationMs +
          state.variation.settleMs +
          (config.confirmMs ?? DEFAULT_SPIN_CONFIG.confirmMs ?? 0) +
          1,
      );
      const face = FACE_ORIENTATIONS.find((item) => item.pip === pip);
      if (!face) throw new Error(`missing face ${pip}`);
      const rotated = rotateVector(stepped.state.quat, face.normal);
      expect(rotated[0]).toBeCloseTo(FRONT_DIRECTION[0], 6);
      expect(rotated[1]).toBeCloseTo(FRONT_DIRECTION[1], 6);
      expect(rotated[2]).toBeCloseTo(FRONT_DIRECTION[2], 6);
    }
  });
});
