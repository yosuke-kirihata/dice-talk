/** unknown 値が null ではない通常の object かどうかを判定する。 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** UI と永続化で受け付ける 6 桁 hex color の形式。 */
export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
