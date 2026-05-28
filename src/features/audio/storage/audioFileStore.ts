import { type AudioFileStore, WebAudioFileStore } from './webAudioFileStore';

/** ブラウザ環境向けの AudioFileStore 実装を生成する。 */
export const createAudioFileStore = (): AudioFileStore => new WebAudioFileStore();
