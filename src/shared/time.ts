/** performance.now が使える環境では高精度時刻を返し、それ以外では Date.now にフォールバックする。 */
export const nowMs = (): number =>
  typeof performance === 'undefined' ? Date.now() : performance.now();
