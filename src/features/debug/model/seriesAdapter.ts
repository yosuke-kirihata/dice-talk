import { toYawPitchRoll } from '@/features/pose';
import type { PoseSnapshot } from '@/shared/pose';

/** デバッグチャートで表示できる系列の種類。 */
export type SeriesKind = 'quat' | 'euler';

/** PoseSnapshot を、デバッグチャートに描画できる系列値へ変換する定義。 */
export interface SeriesDef {
  readonly kind: SeriesKind;
  readonly count: number;
  readonly labels: readonly string[];
  readonly colors: readonly string[];
  readonly yLabel: string;
  readonly toValues: (snap: PoseSnapshot) => readonly number[];
}

const QUAT_COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308'] as const;
const EULER_COLORS = ['#f97316', '#06b6d4', '#a855f7'] as const;

/** クォータニオン成分を描画するチャート系列定義。 */
export const QUAT_SERIES: SeriesDef = {
  kind: 'quat',
  count: 4,
  labels: ['x', 'y', 'z', 'w'],
  colors: QUAT_COLORS,
  yLabel: '', //'component',
  toValues: (snap) => snap.quat,
};

/** オイラー角を度数法で描画するチャート系列定義。 */
export const EULER_SERIES: SeriesDef = {
  kind: 'euler',
  count: 3,
  labels: ['yaw', 'pitch', 'roll'],
  colors: EULER_COLORS,
  yLabel: 'deg',
  toValues: (snap) => {
    const e = toYawPitchRoll(snap.quat);
    return [e.yaw, e.pitch, e.roll];
  },
};

/** デバッグ UI に表示するチャート系列種別の並び順。 */
export const SERIES_KINDS: readonly SeriesKind[] = ['quat', 'euler'];

const REGISTRY: Record<SeriesKind, SeriesDef> = {
  quat: QUAT_SERIES,
  euler: EULER_SERIES,
};

/** 指定した系列種別に対応するチャート定義を返す。 */
export const getSeriesDef = (kind: SeriesKind): SeriesDef => REGISTRY[kind];
