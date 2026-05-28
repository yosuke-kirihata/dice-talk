import {
  fromAxisAngle,
  identity,
  multiply,
  normalize,
  slerp,
} from '@/features/pose/lib/quaternion';
import type { Quat } from '@/shared/pose';

/** スピン結果候補を識別する ID。通常はサイコロの出目番号を使う。 */
export type SpinTargetId = number;

/** スピン結果として選ばれうる出目と、その面のローカル法線。 */
export interface SpinMotionTarget {
  readonly id: SpinTargetId;
  readonly normal: readonly [number, number, number];
}

/** 0〜1 の正規化進捗上に置くスピン速度サンプル。 */
export interface SpinKeyframe {
  readonly at: number;
  readonly speed: number;
}

/** 自動スピンの長さ、速度カーブ、出目重みをまとめた調整可能な設定。 */
export interface SpinMotionConfig {
  readonly holdMs: number;
  readonly durationMs: number;
  readonly settleMs: number;
  readonly confirmMs?: number;
  readonly keyframes: readonly SpinKeyframe[];
  readonly targets?: readonly SpinMotionTarget[];
  readonly pipWeights: readonly [number, number, number, number, number, number];
}

/** 同じ設定でも毎回の動きが単調にならないよう、seed から導くスピン単位の揺らぎ。 */
export interface SpinMotionVariation {
  readonly durationMs: number;
  readonly settleMs: number;
  readonly speedScale: number;
  readonly axisSeed: number;
  readonly axisRateScale: number;
}

/** スピンアニメーションの各フレーム間で引き継ぐ不変状態。 */
export interface SpinMotionState {
  readonly startedAt: number;
  readonly lastAt: number;
  readonly quat: Quat;
  readonly seed: number;
  readonly sortedKeyframes: readonly SpinKeyframe[];
  readonly targetPip: SpinTargetId;
  readonly targetQuat: Quat;
  readonly variation: SpinMotionVariation;
  readonly settleFrom?: Quat;
}

/** スピン状態を 1 フレーム進めた結果。 */
export interface SpinMotionStep {
  readonly state: SpinMotionState;
  readonly done: boolean;
}

/** 自動スピンの標準タイミングと、各出目を等確率にする初期設定。 */
export const DEFAULT_SPIN_CONFIG: SpinMotionConfig = {
  holdMs: 500,
  durationMs: 10000,
  settleMs: 1000,
  confirmMs: 3000,
  keyframes: [
    { at: 0, speed: 34 },
    { at: 0.2, speed: 30 },
    { at: 0.45, speed: 18 },
    { at: 0.7, speed: 8 },
    { at: 0.9, speed: 2 },
    { at: 1, speed: 0 },
  ],
  pipWeights: [1, 1, 1, 1, 1, 1],
};

const DEFAULT_SPIN_TARGETS: readonly [SpinMotionTarget, ...SpinMotionTarget[]] = [
  { id: 1, normal: [1, 0, 0] },
  { id: 2, normal: [0, 1, 0] },
  { id: 3, normal: [0, 0, 1] },
  { id: 4, normal: [0, 0, -1] },
  { id: 5, normal: [0, -1, 0] },
  { id: 6, normal: [-1, 0, 0] },
];
const FRONT_DIRECTION = [0, 0, 1] as const;
const DEFAULT_CONFIRM_MS = 3000;
const CONFIRM_ROCK_CYCLES = 3;
const CONFIRM_ROCK_RADIANS = 0.16;
const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const jitterScale = (seed: number, salt: number, amount: number): number =>
  1 + (seededRandom(seed + salt) * 2 - 1) * amount;

const dot3 = (a: readonly [number, number, number], b: readonly [number, number, number]): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const cross3 = (
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): readonly [number, number, number] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

const quatFromUnitVectors = (
  from: readonly [number, number, number],
  to: readonly [number, number, number],
): Quat => {
  const d = dot3(from, to);
  if (d > 0.999999) return identity();
  if (d < -0.999999) {
    const axis = Math.abs(from[0]) < 0.9 ? cross3(from, [1, 0, 0]) : cross3(from, [0, 1, 0]);
    return fromAxisAngle(axis, Math.PI);
  }
  const c = cross3(from, to);
  return normalize([c[0], c[1], c[2], 1 + d]);
};

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const randomAxis = (
  seed: number,
  tSec: number,
  rateScale: number,
): readonly [number, number, number] => {
  const scaledT = tSec * rateScale;
  const x = Math.sin(seed + scaledT * 2.1);
  const y = Math.cos(seed * 0.7 + scaledT * 1.7);
  const z = Math.sin(seed * 1.3 + scaledT * 2.9);
  const len = Math.hypot(x, y, z);
  return len === 0 ? [0, 1, 0] : [x / len, y / len, z / len];
};

const easeInOutSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2;
const getConfirmMs = (config: SpinMotionConfig): number =>
  Math.max(0, config.confirmMs ?? DEFAULT_CONFIRM_MS);

/** 0〜1 の正規化進捗に対して、キーフレームから角速度を線形補間する。 */
export const interpolateSpinSpeed = (
  keyframes: readonly SpinKeyframe[],
  progress: number,
): number => {
  const sorted = [...keyframes].sort((a, b) => a.at - b.at);
  return interpolateSortedSpinSpeed(sorted, progress);
};

const interpolateSortedSpinSpeed = (sorted: readonly SpinKeyframe[], progress: number): number => {
  if (sorted.length === 0) return 0;
  const p = clamp01(progress);
  const first = sorted[0];
  if (!first) return 0;
  if (p <= first.at) return Math.max(0, first.speed);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const next = sorted[i];
    if (!prev || !next) continue;
    if (p <= next.at) {
      const span = Math.max(1e-6, next.at - prev.at);
      const local = (p - prev.at) / span;
      return Math.max(0, prev.speed + (next.speed - prev.speed) * local);
    }
  }
  const last = sorted[sorted.length - 1];
  return Math.max(0, last?.speed ?? 0);
};

const sortSpinKeyframes = (keyframes: readonly SpinKeyframe[]): readonly SpinKeyframe[] =>
  [...keyframes].sort((a, b) => a.at - b.at);

const getSpinTargets = (config: Pick<SpinMotionConfig, 'targets'>): readonly SpinMotionTarget[] =>
  config.targets && config.targets.length > 0 ? config.targets : DEFAULT_SPIN_TARGETS;

/** deterministic な seed を使い、重みに従ってスピン結果の出目 ID を選ぶ。 */
export const pickTargetPip = (
  weights: SpinMotionConfig['pipWeights'],
  seed: number,
  targets: readonly SpinMotionTarget[] = DEFAULT_SPIN_TARGETS,
): SpinTargetId => {
  const total = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
  if (total <= 0) return 3;
  let threshold = seededRandom(seed) * total;
  for (let i = 0; i < targets.length; i++) {
    threshold -= Math.max(0, weights[i] ?? 0);
    if (threshold <= 0) return targets[i]?.id ?? 6;
  }
  return targets[targets.length - 1]?.id ?? 6;
};

/** 指定出目の面が画面手前を向く最終姿勢クォータニオンを返す。 */
export const getTargetQuatForPip = (
  pip: SpinTargetId,
  targets: readonly SpinMotionTarget[] = DEFAULT_SPIN_TARGETS,
): Quat => {
  const face = targets.find((target) => target.id === pip);
  if (!face) return identity();
  return quatFromUnitVectors(face.normal, FRONT_DIRECTION);
};

const createSpinVariation = (config: SpinMotionConfig, seed: number): SpinMotionVariation => ({
  durationMs: Math.max(1, config.durationMs * jitterScale(seed, 17, 0.12)),
  settleMs: Math.max(1, config.settleMs * jitterScale(seed, 29, 0.1)),
  speedScale: jitterScale(seed, 43, 0.08),
  axisSeed: seed + (seededRandom(seed + 59) * 2 - 1) * 997,
  axisRateScale: jitterScale(seed, 71, 0.18),
});

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

/** 任意の姿勢で、画面手前方向に最も近い出目を判定する。 */
export const getFrontMostPip = (
  quat: Quat,
  targets: readonly SpinMotionTarget[] = DEFAULT_SPIN_TARGETS,
): SpinTargetId => {
  let bestPip: SpinTargetId = targets[0]?.id ?? 3;
  let bestDot = -Infinity;
  for (const face of targets) {
    const normal = rotateVector(quat, face.normal);
    const dot = dot3(normal, FRONT_DIRECTION);
    if (dot > bestDot) {
      bestDot = dot;
      bestPip = face.id;
    }
  }
  return bestPip;
};

/** 現在姿勢から、自動スピン開始時の不変状態を作る。 */
export const startSpinMotion = (
  initialQuat: Quat,
  config: SpinMotionConfig,
  now: number,
  seed = now,
): SpinMotionState => {
  const targets = getSpinTargets(config);
  const targetPip = pickTargetPip(config.pipWeights, seed, targets);
  return {
    startedAt: now,
    lastAt: now,
    quat: normalize(initialQuat),
    seed,
    sortedKeyframes: sortSpinKeyframes(config.keyframes),
    targetPip,
    targetQuat: getTargetQuatForPip(targetPip, targets),
    variation: createSpinVariation(config, seed),
  };
};

/** 絶対時刻までスピン状態を進め、完了済みかどうかを返す。 */
export const stepSpinMotion = (
  state: SpinMotionState,
  config: SpinMotionConfig,
  now: number,
): SpinMotionStep => {
  const targets = getSpinTargets(config);
  const elapsed = Math.max(0, now - state.startedAt);
  const durationMs = state.variation.durationMs;
  const settleMs = state.variation.settleMs;
  const confirmMs = getConfirmMs(config);
  const confirmStartMs = durationMs + settleMs;
  if (elapsed >= confirmStartMs + confirmMs) {
    const next = {
      ...state,
      lastAt: now,
      quat: state.targetQuat,
      ...(state.settleFrom !== undefined && { settleFrom: state.settleFrom }),
    };
    return { state: next, done: true };
  }

  if (elapsed >= confirmStartMs) {
    const settleFrom = state.settleFrom ?? state.quat;
    const targetPip =
      state.settleFrom === undefined ? getFrontMostPip(settleFrom, targets) : state.targetPip;
    const targetQuat =
      state.settleFrom === undefined ? getTargetQuatForPip(targetPip, targets) : state.targetQuat;
    const confirmProgress = clamp01((elapsed - confirmStartMs) / Math.max(1, confirmMs));
    const envelope = Math.sin(Math.PI * confirmProgress);
    const rock = Math.sin(Math.PI * 2 * CONFIRM_ROCK_CYCLES * confirmProgress);
    const angle = CONFIRM_ROCK_RADIANS * envelope * rock;
    const quat = normalize(multiply(targetQuat, fromAxisAngle([1, 0, 0], angle)));
    return {
      state: { ...state, lastAt: now, quat, targetPip, targetQuat, settleFrom },
      done: false,
    };
  }

  if (elapsed >= durationMs) {
    const settleFrom = state.settleFrom ?? state.quat;
    const targetPip =
      state.settleFrom === undefined ? getFrontMostPip(settleFrom, targets) : state.targetPip;
    const targetQuat =
      state.settleFrom === undefined ? getTargetQuatForPip(targetPip, targets) : state.targetQuat;
    const settleProgress = clamp01((elapsed - durationMs) / Math.max(1, settleMs));
    const quat = slerp(settleFrom, targetQuat, easeInOutSine(settleProgress));
    return {
      state: { ...state, lastAt: now, quat, targetPip, targetQuat, settleFrom },
      done: false,
    };
  }

  const dtSec = Math.max(0, now - state.lastAt) / 1000;
  const progress = durationMs <= 0 ? 1 : elapsed / durationMs;
  const speed =
    interpolateSortedSpinSpeed(state.sortedKeyframes, progress) * state.variation.speedScale;
  const axis = randomAxis(state.variation.axisSeed, elapsed / 1000, state.variation.axisRateScale);
  const delta = fromAxisAngle(axis, speed * dtSec);
  const quat = normalize(multiply(delta, state.quat));
  return { state: { ...state, lastAt: now, quat }, done: false };
};
