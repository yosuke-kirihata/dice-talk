import { Euler, Quaternion as ThreeQuaternion } from 'three';
import type { Quat } from '@/shared/pose';

/** デバッグ HUD と同じ Y-X-Z 順で扱う、度数法のヨー・ピッチ・ロール角。 */
export interface YawPitchRoll {
  readonly yaw: number;
  readonly pitch: number;
  readonly roll: number;
}

const RAD2DEG = 180 / Math.PI;

/** クォータニオンを、ユーザーが読みやすい度数法のヨー・ピッチ・ロールへ変換する。 */
export const toYawPitchRoll = (q: Quat): YawPitchRoll => {
  const e = new Euler().setFromQuaternion(new ThreeQuaternion(q[0], q[1], q[2], q[3]), 'YXZ');
  return { yaw: e.y * RAD2DEG, pitch: e.x * RAD2DEG, roll: e.z * RAD2DEG };
};

/** 回転なしを表す単位クォータニオンを返す。 */
export const identity = (): Quat => [0, 0, 0, 1];

const dot = (a: Quat, b: Quat): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];

/** 2 つのクォータニオン間を球面線形補間する。 */
export const slerp = (a: Quat, b: Quat, t: number): Quat => {
  let cosTheta = dot(a, b);
  let bx = b[0];
  let by = b[1];
  let bz = b[2];
  let bw = b[3];
  if (cosTheta < 0) {
    cosTheta = -cosTheta;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  if (cosTheta > 0.9995) {
    return normalize([
      a[0] + (bx - a[0]) * t,
      a[1] + (by - a[1]) * t,
      a[2] + (bz - a[2]) * t,
      a[3] + (bw - a[3]) * t,
    ]);
  }
  const theta = Math.acos(cosTheta);
  const sinTheta = Math.sin(theta);
  const wA = Math.sin((1 - t) * theta) / sinTheta;
  const wB = Math.sin(t * theta) / sinTheta;
  return [a[0] * wA + bx * wB, a[1] * wA + by * wB, a[2] * wA + bz * wB, a[3] * wA + bw * wB];
};

/** 軸ベクトルとラジアン角から、正規化済みクォータニオンを作る。 */
export const fromAxisAngle = (axis: readonly [number, number, number], radians: number): Quat => {
  const [x, y, z] = axis;
  const axisLen = Math.hypot(x, y, z);
  if (axisLen === 0) return identity();
  const inv = 1 / axisLen;
  const half = radians / 2;
  const s = Math.sin(half);
  return [x * inv * s, y * inv * s, z * inv * s, Math.cos(half)];
};

/** クォータニオンを単位長に正規化する。長さ 0 の入力は単位クォータニオンへフォールバックする。 */
export const normalize = (q: Quat): Quat => {
  const len = Math.hypot(q[0], q[1], q[2], q[3]);
  if (len === 0) return identity();
  const inv = 1 / len;
  return [q[0] * inv, q[1] * inv, q[2] * inv, q[3] * inv];
};

/** 2 つの回転を合成する。適用順は b の後に a。 */
export const multiply = (a: Quat, b: Quat): Quat => {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
};
