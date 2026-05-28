/** URL query に debugMock=1 が指定されているかを判定する。 */
export const isDebugMockEnabled = (): boolean =>
  typeof window !== 'undefined' && /[?&]debugMock=1(&|$)/.test(window.location.search);
