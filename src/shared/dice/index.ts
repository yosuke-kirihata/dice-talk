/** Three.js の material index 順で並ぶ 6 面の色。順序は right, left, top, bottom, front, back。 */
export type FaceColors = readonly [string, string, string, string, string, string];

/** ジオメトリ、ラベル、向き計算で共有する立方体面の安定 ID。 */
export type FaceId = 'right' | 'left' | 'top' | 'bottom' | 'front' | 'back';

/** ユーザーに見えるサイコロの出目番号。 */
export type DicePip = 1 | 2 | 3 | 4 | 5 | 6;

/** すべての出目番号を昇順で並べた一覧。 */
export const DICE_PIPS = [1, 2, 3, 4, 5, 6] as const satisfies readonly DicePip[];

/** 描画される立方体面と、その面に表示する出目の対応。 */
export interface DiceFaceDefinition {
  readonly id: FaceId;
  readonly pip: DicePip;
  readonly materialIndex: number;
  readonly normal: readonly [number, number, number];
}

/** 1 つの出目がローカル座標でどちらを向くかを表す情報。 */
export interface FaceOrientation {
  readonly id: FaceId;
  readonly pip: DicePip;
  readonly normal: readonly [number, number, number];
}

/** 描画とスピン結果判定で共有する標準のサイコロ面レイアウト。 */
export const DICE_FACE_DEFINITIONS: readonly DiceFaceDefinition[] = [
  { id: 'right', pip: 1, materialIndex: 0, normal: [1, 0, 0] },
  { id: 'left', pip: 6, materialIndex: 1, normal: [-1, 0, 0] },
  { id: 'top', pip: 2, materialIndex: 2, normal: [0, 1, 0] },
  { id: 'bottom', pip: 5, materialIndex: 3, normal: [0, -1, 0] },
  { id: 'front', pip: 3, materialIndex: 4, normal: [0, 0, 1] },
  { id: 'back', pip: 4, materialIndex: 5, normal: [0, 0, -1] },
];

export const FACE_ORIENTATIONS: readonly FaceOrientation[] = DICE_FACE_DEFINITIONS.map((face) => ({
  id: face.id,
  pip: face.pip,
  normal: face.normal,
}));

/** 出目判定で「画面手前を向いている」とみなすワールド座標方向。 */
export const FRONT_DIRECTION = [0, 0, 1] as const;

/** 指定した出目の向き情報を返す。レイアウト外の値なら null を返す。 */
export const getFaceOrientationByPip = (pip: DicePip): FaceOrientation | null =>
  FACE_ORIENTATIONS.find((face) => face.pip === pip) ?? null;
