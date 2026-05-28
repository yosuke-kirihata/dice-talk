/** 0 以上の秒数を m:ss または m:ss.s 形式の短い表示文字列へ変換する。 */
export const formatMinSec = (totalSeconds: number): string => {
  const safe = Math.max(0, Number.isFinite(totalSeconds) ? totalSeconds : 0);
  const rounded = Math.round(safe * 10) / 10;
  const minutes = Math.floor(rounded / 60);
  const seconds = Math.round((rounded - minutes * 60) * 10) / 10;
  if (Number.isInteger(seconds)) {
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`;
};

/** m:ss または秒数文字列を秒数へ変換する。解釈できない場合は null を返す。 */
export const parseMinSec = (raw: string): number | null => {
  const text = raw.trim();
  if (!text) return null;
  if (text.includes(':')) {
    const parts = text.split(':');
    if (parts.length !== 2) return null;
    const minutesRaw = parts[0]?.trim() ?? '';
    const secondsRaw = parts[1]?.trim() ?? '';
    if (!/^\d+$/.test(minutesRaw)) return null;
    if (!/^\d+(?:\.\d+)?$/.test(secondsRaw)) return null;
    const minutes = Number.parseInt(minutesRaw, 10);
    const seconds = Number.parseFloat(secondsRaw);
    if (seconds >= 60) return null;
    return minutes * 60 + seconds;
  }
  if (!/^\d+(?:\.\d+)?$/.test(text)) return null;
  return Number.parseFloat(text);
};
