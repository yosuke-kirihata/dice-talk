/** サイコロの角丸半径を、サイズに対して破綻しない範囲へ丸める。 */
export const clampDiceRadius = (radius: number, size: number): number => {
  const max = size / 2 - 1e-3;
  return Math.max(0, Math.min(radius, max));
};
