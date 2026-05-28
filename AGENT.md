# dice-talk

タッチ操作で回せる 3D サイコロを表示する、Web ファーストの PWA です。

## ドキュメント

- **設計仕様:** [`docs/spec.md`](./docs/spec.md)
- **ADR:** [`docs/adr/`](./docs/adr/)

## 技術スタック

Vite 8 + React 19 + TypeScript 6 / Three.js / Web App Manifest + service worker / Vitest / pnpm。

## 現状

- アプリはブラウザ / PWA のみを対象にしています。
- 姿勢入力はタッチ入力、またはテスト用のスクリプト入力です。
- 永続化は Web API を使います。JSON 設定は localStorage、効果音ファイルは IndexedDB に保存します。
- ネイティブプロジェクトと無線デバイス通信コードは意図的に含めません。

## 規約

- 姿勢データはクォータニオン優先です。`Quat = readonly [number, number, number, number]` を内部表現にします。
- `SceneManager` と `DiceCanvas` は `PoseSource` のみに依存します。
- Three.js オブジェクトを React state / props に載せません。
- 高頻度のデバッグチャートデータは React state に積まず、`PoseRingBuffer` / `UPlotTimeSeries` で扱います。
- ファイルはおおむね 50-250 行に収めます。

## コマンド

```bash
pnpm dev
pnpm build
pnpm test
pnpm typecheck
pnpm lint
pnpm check
```
