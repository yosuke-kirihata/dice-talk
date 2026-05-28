import { Quaternion as ThreeQuaternion } from 'three';
import type { Quat } from './types';

/** アプリ内の Quat タプルを Three.js の Quaternion インスタンスへ変換する。 */
export const toThree = (q: Quat): ThreeQuaternion => new ThreeQuaternion(q[0], q[1], q[2], q[3]);
