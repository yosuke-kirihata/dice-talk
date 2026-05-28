import { BoxGeometry, type BufferGeometry, MeshStandardMaterial } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { FaceColors } from '@/shared/dice';
import { clampDiceRadius } from '@/shared/dice/geometry';
import type { FaceTextMap } from './designState';

export type { DiceFaceDefinition, DicePip, FaceColors, FaceId } from '@/shared/dice';
export { DICE_FACE_DEFINITIONS } from '@/shared/dice';

/** 立方体面の material index 順で並ぶ、サイコロ面の初期色。 */
export const DEFAULT_FACE_COLORS: FaceColors = [
  '#e63946',
  '#457b9d',
  '#2a9d8f',
  '#f4a261',
  '#a663cc',
  '#f1c40f',
];

const ROUNDED_SEGMENTS = 4;

/** サイコロ mesh のジオメトリと面 material を生成するためのオプション。 */
export interface DiceGeometryOptions {
  readonly faceColors?: FaceColors;
  readonly size?: number;
  readonly radius?: number;
  readonly faceTexts?: FaceTextMap;
}

/** DiceMesh がサイコロ本体を描画するために必要な Three.js オブジェクト。 */
export interface DiceGeometryResult {
  readonly geometry: BufferGeometry;
  readonly materials: readonly MeshStandardMaterial[];
}

/** 角丸設定に応じた cube / rounded cube ジオメトリと、各面 material を生成する。 */
export const createDiceGeometry = (opts: DiceGeometryOptions = {}): DiceGeometryResult => {
  const size = opts.size ?? 1;
  const colors = opts.faceColors ?? DEFAULT_FACE_COLORS;
  const radius = clampDiceRadius(opts.radius ?? 0, size);
  const geometry =
    radius > 0
      ? new RoundedBoxGeometry(size, size, size, ROUNDED_SEGMENTS, radius)
      : new BoxGeometry(size, size, size);
  const materials = colors.map(
    (color) => new MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.05 }),
  );
  return { geometry, materials };
};
