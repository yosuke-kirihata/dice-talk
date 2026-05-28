# DESIGN.md - dice-talk UI Design

> このファイルは、`dice-talk` の現在のUIを元にしたデザイン仕様です。
> AIエージェントや開発者がUIを追加・修正するときは、ここに書かれた見た目、密度、操作導線、アクセシビリティ方針に合わせてください。

## 1. Product Feel

`dice-talk` は、3Dサイコロを中心にした会話きっかけアプリです。第一画面は説明やランディングページではなく、すぐにサイコロを触れるフルスクリーンの操作面にします。

- **印象**: 軽い、親しみやすい、遊び心があるが、操作面は整理されている。
- **主役**: 画面中央の3Dサイコロ。UIはサイコロを邪魔しない浮遊コントロールとして配置する。
- **UI密度**: メイン画面は最小限。詳細操作はメニュー、テーマ選択、設定ダイアログへ逃がす。
- **色調**: 白、薄いブルー、薄いグレーをベースに、紫を主要アクセントとして使う。面色やテーマカードでは明るい複数色を許容する。
- **角丸**: 操作ボタンはピル型、カードやパネルは14pxから26px程度の丸み。
- **影**: 軽い浮遊感を出す。メインUIは `rgba(31, 41, 55, 0.10-0.18)`、モーダルは `rgba(15, 23, 42, 0.15)` を基準にする。

## 2. Screen Structure

### Main Canvas

- ルートは `position: fixed; inset: 0; overflow: hidden;` のフルスクリーン。
- 背景は白から薄いグレーへの縦グラデーションに、右上寄りの淡いブルーのラジアルグラデーションを重ねる。
- `DiceCanvas` は画面全体に絶対配置し、3Dサイコロを常に主役として扱う。
- `TouchInputLayer` も画面全体に絶対配置し、画面上の長押し・ドラッグ入力を受ける。

### Top Chrome

上部UIは `role="toolbar"` の3列グリッドです。

- 左: メニューボタン。44px円形。
- 中央: テーマ名ピル。現在のテーマ名、パレットアイコン、下向きアイコンを表示。
- 右: 選択中がマイテーマの場合だけテーマ編集ボタン。プリセット選択中は44pxのスペーサーで中央揃えを維持する。
- safe area を考慮し、上端は `max(env(safe-area-inset-top), 18px)` を基準にする。

### Bottom CTA

- 画面下中央に「長押しして、サイコロをふる」ボタンを置く。
- 幅は最大280px、最小48px高。
- サイコロアイコン付き、紫文字、薄い紫ボーダー、白半透明背景。
- safe area を考慮し、下端は `max(env(safe-area-inset-bottom), 20px)` を基準にする。

## 3. Color System

このアプリは厳密なトークンファイルを持たないため、CSS内の実値をデザイン基準とします。

### Base

| Role | Color | Usage |
| --- | --- | --- |
| Page text | `#1a1a1a` | アプリ全体の標準文字色 |
| Strong text | `#111827` | 見出し、メニュー、主要ラベル |
| Panel dark text | `#0f172a` | パネル見出し、閉じるボタン |
| Body muted | `#334155` | 説明文 |
| Secondary muted | `#64748b` | 補足情報、メタデータ |
| Disabled/subtle | `#767676` | バージョン表示など |
| White | `#ffffff` | パネル、カード、浮遊ボタン |
| Soft surface | `#fbfcff` | 入力背景、設定本文背景 |
| Page gray | `#f2f2f2` | 背景グラデーション終端 |

### Accent

| Role | Color | Usage |
| --- | --- | --- |
| Primary purple | `#7c3aed` | 選択状態、主要ボタン、アクセントアイコン |
| Primary purple hover | `#6d28d9` | 主要ボタンhover、CTA文字 |
| Deep purple | `#5b21b6` | CTA hover、アウトラインボタン文字 |
| Soft purple | `#f4f1ff` | バッジ、案内パネル背景 |
| Purple border | `#ddd6fe` | CTA、キャンセル系ボーダー |
| Purple focus fill | `#c4b5fd` | focus/input境界、hover border |
| Focus ring | `#ffd43d` | `:focus-visible` のアウトライン |
| Danger | `#ef4444` / `#dc2626` | 削除、破壊的操作 |
| Danger bg | `#fff1f2` | 削除hover、確認ボタン背景 |

### Borders and Dividers

- 通常カード: `#e5e7eb`
- セクション境界: `#edf0f5` / `#eef2f7`
- 入力境界: `#e2e8f0`
- パネル境界: `rgba(226, 232, 240, 0.82)`

### Theme Face Colors

プリセットテーマのサイコロ面は明るい多色構成です。白面を1つ含め、ピンク、ブルー、イエロー、ミント、パープルなどを組み合わせます。

- デフォルト例: `#ffffff`, `#fb7185`, `#60a5fa`, `#facc15`, `#5eead4`, `#a78bfa`
- 学校・家族・飲み会などのテーマでは、用途に合わせて同程度の明度・彩度の色を使う。
- テーマカードのサムネイルは `public/assets/dice-icons/` のPNGを使う。CSSだけの抽象図形に置き換えない。

## 4. Typography

### Font Stack

```css
font-family: "Noto Sans JP", -apple-system, BlinkMacSystemFont, sans-serif;
```

等幅表示は以下を使います。

```css
font-family: "Noto Sans Mono", monospace;
```

### Type Scale

| Use | Size | Weight | Line height |
| --- | --- | --- | --- |
| Dialog hero title | 30px desktop / 24px mobile | 900 | 1.25 |
| Dialog title | 24-26px desktop / 20-22px mobile | 900 | 1.3-1.35 |
| Section heading | 20-22px | 900 | 1.35 |
| Card title | 16-18px | 900 | 1.35 |
| Main button | 14px | 700-900 | inherit |
| Menu item | 15px | 700 | inherit |
| Body/description | 15-17px | 700 | 1.6-1.7 |
| Form label | 12-13px | 800-900 | normal |
| Metadata | 11-13px | 700-900 | 1.4-1.6 |

### Rules

- `letter-spacing` は原則 `0`。ライセンス項目の `dt` のようなメタラベルだけ `0.08em` を許容する。
- 日本語本文は `line-height: 1.6-1.7` を基本にして詰めすぎない。
- ボタン内テキストは折り返さず、必要な箇所は `text-overflow: ellipsis` や `<wbr />` で制御する。

## 5. Components

### Floating Icon Button

使用箇所: メニュー、テーマ編集、戻る/閉じる。

- 44px円形を基本に、ダイアログヘッダーでは52px、モバイルでは46px。
- 背景は白または白半透明。
- アイコンは `react-icons/io5` を使う。
- hover可能環境では背景を少し明るくし、影を強め、`translateY(-1px)` する。
- focusは `outline: 3px solid #ffd43d; outline-offset: 3px;`。

### Theme Pill

- 上部中央の現在テーマ表示。
- 高さ42px以上、最大幅は `clamp(150px, 46vw, 240px)`。
- テーマ名は省略表示し、`title` にフル名称を入れる。
- アイコン、テキスト、Chevronの順に9px gap。

### Roll CTA

- 下部中央の主要操作。
- 高さ48px以上、最大幅280px。
- サイコロアイコンと「長押しして、サイコロをふる」。
- `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel` を受けるため、見た目だけでなく押し続ける操作に向いたサイズを維持する。

### Side Menu

- 左からスライドするナビゲーション。
- 幅は `clamp(260px, 72vw, 320px)`。
- 背景は `rgba(255, 255, 255, 0.97)`、右側だけ `24px` 丸める。
- 背面スクリーンは開いた状態で `rgba(17, 24, 39, 0.35)`。
- 項目はアイコン28px列 + テキスト1frのグリッド、最小高56px。
- 「テーマ編集」はマイテーマ選択時のみ表示する。
- 下部に「OSSライセンス」とバージョン表示を置く。

### Modal Panels

対象: テーマ設定、テーマ編集、動作設定、使い方、OSSライセンス、確認ダイアログ。

- 背景は薄いブルーのラジアルグラデーション + `rgba(248, 250, 252, 0.72)` + `backdrop-filter: blur(14px)`。
- パネル幅は用途別:
  - テーマ設定・設定系: 最大720px
  - 使い方: 最大960px
  - ライセンス: 最大760px
  - 確認: 最大360px
- パネル高さは `max-height: min(92dvh, 900px)`、モバイルでは `96dvh`。
- 角丸はdesktop 26px、mobile 24px。
- ヘッダーは `56px 1fr 56px` の3列で中央タイトルを安定させる。モバイルは48px、狭小は44px。
- 本文は縦スクロール可能にし、`overscroll-behavior: contain` を指定する。

### Theme Select

- タイトルは「テーマ設定」。
- タブは「マイテーマ」「プリセット」の2つ。選択中は紫文字 + 3px下線。
- カードグリッド:
  - desktop: 3列
  - 760px以下: 2列
  - 430px以下: 1列
- カードは白背景、14px角丸、最小高224px。mobileでは196px、狭小では178px。
- 選択中カードは紫border + 1px外側ring + 軽い紫shadow。
- マイテーマカードには左上編集ボタン、右上削除ボタンを重ねる。
- 新規作成カードは dashed border と丸い追加アイコンを使う。
- 下部の案内noteは薄紫グラデーション背景、電球アイコン付き。

### Theme Edit Panel

- タイトルは「テーマ編集」。
- 先頭にテーマ概要カードを置き、サムネイルとテーマ名入力を並べる。
- 「サイコロの内容」では1から6の面を縦に並べ、面番号バッジ + 2行textareaで編集する。
- 「面の色」では面番号バッジ + color input + hex inputを並べる。
- 初期化ボタンは赤系アウトラインのピルボタン。

### App Settings Panel

- タイトルは「動作設定」。
- セクション:
  - サイコロ設定: 角丸、サイズのrange。
  - 回転モーション: 長押しms、回転ms、停止ms、キーフレーム位置/速度。
  - 軸表示: ワールド軸、ローカル軸、上方向矢印のcheckbox。
  - 効果音: 有効化、ファイル選択、プレビュー等。
- range、checkbox、file selectorのaccent colorは紫。
- 動作設定の初期化は赤系アウトラインのピルボタン。

### Usage Dialog

- ヒーローにサイコロPNGアイコン、タイトル「サイコロトークの使い方」、短い説明文。
- 基本操作は3ステップ:
  1. サイコロを長押し
  2. 指を離してサイコロを振る
  3. 出目が確定
- 各ステップは番号バッジ、PNGイラスト、テキストの3列。430px以下ではイラストを非表示にして2列にする。
- 「ポイント」は淡い黄色背景、チェックアイコン付きリスト。
- 「各ボタンの説明」は5列グリッド。760px以下では2列。
- 日本語の短文が詰まる箇所は `<wbr />` を使い、狭い幅で不自然に溢れないようにする。

### Confirm Dialog

- 削除確認など破壊的操作に使う。
- 幅最大360px、padding 22px。
- キャンセルは紫アウトライン、確定は赤系背景。
- ボタンは44px以上のピル型。

## 6. Layout and Responsiveness

### Breakpoints

主なCSSブレークポイントは以下です。

- `max-width: 760px`: モーダル余白、ヘッダー高さ、グリッド列数、本文paddingを縮小。
- `max-width: 430px`: テーマカード1列化、ヘッダー左右列44px、使い方ステップのイラスト非表示。

### Safe Area

iOS PWAを前提に、上部・下部の主要UIとモーダルpaddingには `env(safe-area-inset-*)` を必ず考慮します。

### Sizing

- タッチターゲットは原則44px以上。
- フルスクリーンUIは `100dvh` 相当の変動を考慮し、モーダルは `92dvh` / `96dvh` の中でスクロールさせる。
- 画面上の浮遊UIは `pointer-events: none` のコンテナ内に置き、ボタン自身だけ `pointer-events: auto` にする。

## 7. Motion

- 標準transitionは `160ms ease`。サイドメニューの開閉は `220ms ease`、backdropは `180ms ease`。
- hoverでは `translateY(-1px)` またはメニュー項目の `translateX(2px)` 程度に留める。
- モーションは操作感の補助であり、3Dサイコロの回転を邪魔しない。

## 8. Accessibility

- ダイアログは `role="dialog"` と `aria-modal="true"` を持つ。
- 上部/下部Chromeは `role="toolbar"` と適切な `aria-label` を持つ。
- アイコンだけのボタンには必ず `aria-label` を付ける。
- 装飾PNGやアイコンは `aria-hidden` にする。
- 視覚的に隠す見出しはスクリーンリーダー用に残す。
- `:focus-visible` は黄色3pxアウトラインで統一する。
- タブは `role="tablist"` / `role="tab"` / `aria-selected` を使う。
- 選択カードは `aria-pressed` を使う。
- 背景クリックで閉じられるスクリーンにも閉じるラベルを付ける。

## 9. Assets and Icons

- アプリ内アイコンは `react-icons/io5` を使う。
- テーマ・使い方のサイコロイラストは `public/assets/dice-icons/` のPNGを使う。
- 3DサイコロはCanvas/Three.js描画を主役にし、HTML/CSSの疑似サイコロで代替しない。
- 新規アセットを追加する場合は、既存PNGと同じ明るくフラットなトーンに合わせる。

## 10. Copy Tone

- 日本語は短く、行動がすぐ分かる文にする。
- 主要ラベル例:
  - `テーマ設定`
  - `マイテーマ`
  - `プリセット`
  - `テーマ編集`
  - `動作設定`
  - `使い方`
  - `長押しして、サイコロをふる`
- 遊び心のある説明は使い方ダイアログや案内noteに限定し、操作ボタンは具体的な動詞を優先する。

## 11. Implementation Notes

- 主要スタイルは `src/app/styles/*.css` に分割されている。
- `src/index.css` ではTailwindを読み込みつつ、base layerで全体フォント、box sizing、body固定挙動を定義する。
- UI追加時は既存クラス命名に合わせ、`app-chrome__*`、`theme-select-*`、`settings-drawer__*`、`design-panel__*` のような機能単位の命名を使う。
- パネル内にさらに大きなカードを過剰に入れ子にしない。カードはテーマカード、設定セクション、使い方ステップなど、明確な情報単位だけに使う。
- 既存の `README.md` や `docs/spec.md` は設計・仕様説明、`DESIGN.md` は見た目とUI振る舞いの基準として扱う。
