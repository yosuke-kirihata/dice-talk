/** localStorage から JSON 文字列として保存した preference を読み込む。SSR 中や未保存時は null を返す。 */
export const loadJsonPreference = async (key: string): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
};

/** JSON 文字列として組み立て済みの preference を localStorage へ保存し、容量超過を安定した Error にする。 */
export const saveJsonPreference = async (key: string, value: string): Promise<void> => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    const message =
      error instanceof DOMException && error.name === 'QuotaExceededError'
        ? `Storage quota exceeded while saving ${key}`
        : `Failed to save ${key}`;
    throw new Error(message);
  }
};
