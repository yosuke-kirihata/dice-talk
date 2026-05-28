/** AudioCuePlayer が Howler に渡す最小限のオプション。 */
export interface HowlOptions {
  readonly src: string[];
  readonly html5: boolean;
  readonly volume: number;
  readonly sprite: {
    readonly cue: [number, number];
  };
}

/** キュー再生に必要な Howler の Howl API サブセット。 */
export interface Howl {
  play(sprite?: string): unknown;
  stop(): unknown;
  unload(): unknown;
}

type HowlFactory = (opts: HowlOptions) => Howl;

/** 準備済みの音声 sprite を 1 つ保持し、差し替えや破棄時に blob URL を解放する。 */
export class AudioCuePlayer {
  private howl: Howl | null = null;
  private currentUrl: string | null = null;
  private readonly howlFactory: HowlFactory;

  constructor(howlFactory: HowlFactory) {
    this.howlFactory = howlFactory;
  }

  /** 指定 URL の音声から秒単位の範囲を切り出し、現在のキューとして準備する。 */
  async prepare(
    url: string,
    config: { startSec: number; endSec: number; volume: number },
  ): Promise<void> {
    this.howl?.unload();
    if (this.currentUrl !== url) this.revokeCurrentUrl();
    this.currentUrl = url;
    const startMs = Math.round(config.startSec * 1000);
    const durationMs = Math.round((config.endSec - config.startSec) * 1000);
    this.howl = this.howlFactory({
      src: [url],
      html5: true,
      volume: config.volume,
      sprite: { cue: [startMs, durationMs] },
    });
  }

  /** 準備済みのキューがあれば再生する。 */
  play(): void {
    this.howl?.play('cue');
  }

  /** 準備済みキューは保持したまま、現在の再生だけを停止する。 */
  stop(): void {
    this.howl?.stop();
  }

  /** 準備済みキューを破棄し、必要に応じて現在の blob URL を解放する。 */
  unload(): void {
    this.howl?.unload();
    this.howl = null;
    this.revokeCurrentUrl();
  }

  private revokeCurrentUrl(): void {
    if (this.currentUrl?.startsWith('blob:')) URL.revokeObjectURL(this.currentUrl);
    this.currentUrl = null;
  }
}
