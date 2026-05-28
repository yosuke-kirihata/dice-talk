import { DEFAULT_FACE_COLORS, type DicePip, type FaceColors } from './diceGeometry';

/** 各出目面に表示するテキストを、出目番号で引ける形にしたマップ。 */
export type FaceTextMap = Readonly<Record<DicePip, string>>;

/** 各出目面に割り当てる CSS hex 色を、出目番号で引ける形にしたマップ。 */
export type FaceColorMap = Readonly<Record<DicePip, string>>;

/** サイコロ本体の見た目と面内容に関する、ユーザー編集可能な設定。 */
export interface DiceDesignState {
  readonly radius: number;
  readonly size: number;
  readonly faceTexts: FaceTextMap;
  readonly faceColors: FaceColorMap;
}

/** プリセットやカスタムテーマが適用される前に使う初期面テキスト。 */
export const DEFAULT_FACE_TEXTS: FaceTextMap = {
  1: '最近うれしかったことは？',
  2: 'おすすめの映画は？',
  3: '子どもの頃の夢は？',
  4: '行ってみたい場所は？',
  5: '今、はまっていることは？',
  6: '明日から1週間、何をしたい？',
};

/** Three.js の material index ではなく、出目番号をキーにした初期面色。 */
export const DEFAULT_FACE_COLORS_BY_PIP: FaceColorMap = {
  1: DEFAULT_FACE_COLORS[0],
  2: DEFAULT_FACE_COLORS[2],
  3: DEFAULT_FACE_COLORS[4],
  4: DEFAULT_FACE_COLORS[5],
  5: DEFAULT_FACE_COLORS[3],
  6: DEFAULT_FACE_COLORS[1],
};

/** 出目番号キーの色マップを、サイコロジオメトリが要求する material index 順へ変換する。 */
export const faceColorMapToFaceColors = (faceColors: FaceColorMap): FaceColors => [
  faceColors[1],
  faceColors[6],
  faceColors[2],
  faceColors[5],
  faceColors[3],
  faceColors[4],
];

/** リセット、移行、保存値欠落時の補完に使うサイコロ見た目設定の基準値。 */
export const DEFAULT_DICE_DESIGN: DiceDesignState = {
  radius: 0.15,
  size: 1,
  faceTexts: DEFAULT_FACE_TEXTS,
  faceColors: DEFAULT_FACE_COLORS_BY_PIP,
};
