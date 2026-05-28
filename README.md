# dice-talk

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

タッチ操作で回せる 3D サイコロを表示する、Web ファーストの PWA です。

Three.js で角丸の 6 面サイコロを描画し、マウス / タッチ入力で姿勢を操作できます。プリセット / カスタムテーマでサイコロの見た目とモーション、効果音を切り替えられます。姿勢やデザインを確認するためのデバッグシートも備えています。ネイティブアプリのラッパーや無線デバイス通信のコードは含みません。

## 主な機能

- タップで回転、ドラッグで姿勢を操作できる 3D サイコロ
- プリセットテーマとカスタムテーマの管理（面テキスト、面色、角丸、サイズ、モーション、効果音）
- 効果音は IndexedDB にユーザーファイルを保存可能
- 使い方ダイアログと OSS ライセンス表示
- 姿勢時系列の uPlot リアルタイムチャートと、デバッグ用デザイン調整シート
- Web App Manifest + service worker による PWA インストールとオフライン対応

## 技術スタック

| 領域 | 採用 |
|------|------|
| ビルド | Vite 8 |
| UI | React 19 + TypeScript 6 |
| 状態管理 | Zustand |
| 3D | Three.js |
| グラフ | uPlot |
| サウンド | Howler |
| アイコン | react-icons |
| PWA | Web App Manifest + service worker |
| 永続化 | localStorage + IndexedDB |
| テスト | Vitest + Testing Library + jsdom |
| 品質 | Biome + 境界チェックスクリプト |

## セットアップ

```bash
corepack enable pnpm
pnpm install
pnpm dev
```

ブラウザで `http://localhost:5173` を開きます。`pnpm dev` / `pnpm build` の事前ステップで `scripts/generate-oss-licenses.mjs` が走り、`src/features/licenses/data/ossLicenses.json` を再生成します。

## 開発コマンド

| コマンド | 用途 |
|----------|------|
| `pnpm dev` | OSS ライセンス生成後に Vite 開発サーバを起動 |
| `pnpm build` | OSS ライセンス生成 → TypeScript 型チェック → PWA を `dist/` にビルド |
| `pnpm preview` | ビルド済み成果物をローカル配信 |
| `pnpm test` | Vitest を実行 |
| `pnpm test:watch` | Vitest を watch モードで実行 |
| `pnpm test:coverage` | カバレッジ計測付きで Vitest を実行 |
| `pnpm typecheck` | TypeScript の型チェックのみ実行 |
| `pnpm lint` | Biome lint と feature 境界チェックを実行 |
| `pnpm format` | Biome の formatter を書き込みモードで実行 |
| `pnpm check` | Biome check を実行し、自動修正を書き込み |
| `pnpm generate:licenses` | OSS ライセンス情報を再生成 |

## ディレクトリ構成

```text
src/
  app/                  アプリシェル、画面構成、app 専用コンポーネント、共通スタイル
  components/ui/        汎用 UI プリミティブ（Segmented、ConfirmDialog など）
  features/audio/       効果音モデル、再生、IndexedDB ファイル保存、設定 UI
  features/debug/       姿勢チャートとデバッグ用設定 / デザイン調整シート
  features/dice/        サイコロのジオメトリ、シーン、Canvas、サイコロ面テーマ
  features/licenses/    OSS ライセンスデータと表示ダイアログ
  features/pose/        タッチ / スクリプト入力の PoseSource、スピンモーション
  features/theme/       テーマ選択ダイアログ
  features/usage/       使い方ダイアログ
  hooks/                app-wide なカスタムフック（永続化、サービス生成、シーン配線など）
  shared/dice/          サイコロ関連の共通型 / 形状ヘルパー
  shared/pose/          姿勢データ型と Three.js アダプタ
  shared/storage/       Web ストレージ用ヘルパー（JSON 設定など）
  shared/time.ts        時間関連ユーティリティ
  shared/validation.ts  入力検証ヘルパー
  store/                Zustand ストア、selector、action
  types/                アプリ横断の合成型
  lib/                  プロジェクト共通の補助モジュール
public/
  manifest.webmanifest
  sw.js
  pwa-icon.svg
  assets/dice-icons/    テーマ / 使い方ダイアログ用イラスト
scripts/
  generate-oss-licenses.mjs   依存パッケージから OSS ライセンス一覧を生成
  check-boundaries.mjs        feature 間の不正な import を検出
```

`@` エイリアスは `src/` を指します（`tsconfig.app.json` と `vite.config.ts` で定義）。`app` から他 feature の内部ファイルを直接 import することは避け、各 feature の `index.ts` 経由で公開された API のみを利用してください。

## ドキュメント

- 設計仕様: [`docs/spec.md`](./docs/spec.md)
- ADR: [`docs/adr/`](./docs/adr/)
- デザイン方針: [`DESIGN.md`](./DESIGN.md)
- エージェント向けガイド: [`AGENT.md`](./AGENT.md) / [`CLAUDE.md`](./CLAUDE.md)
