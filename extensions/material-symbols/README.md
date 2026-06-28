# Material Symbols + Lucide (Raycast Extension)

[Material Symbols](https://fonts.google.com/icons)（約 4,262）と [Lucide](https://lucide.dev/)（約 1,986）のアイコンを Raycast から検索し、**SVG / 画像(PNG) としてコピー・貼り付け**するための拡張機能です。2 つのアイコンセットをその場で切り替えられます。

完全オフラインで動作します（フォント / アイコンデータを同梱し、選択時に SVG をローカル生成。PNG 化も WASM でローカル実行）。

## 特長

- 🔀 **2 セット切替**: Material Symbols（Outlined / Rounded / Sharp）⇄ Lucide
- 🔍 名前 + タグ（同義語）で高速検索。Material は人気順表示
- 🅰️ Material: **FILL**（中抜き / 塗り）・**Weight 100–700** をその場で変更
- ✏️ Lucide: **Stroke 幅 1–3** をその場で変更
- 🌈 **色をライブ変更**: プリセット色 + カスタム HEX。一覧プレビューも選択色で表示、最近の色を記憶
- 📐 **サイズ**もその場で変更（16〜256px）
- 📋 出力形式が豊富:
  - **画像 (PNG) を貼り付け / コピー**（Slack・Keynote・Figma などにそのまま画像で）— **既定アクション**
  - SVG コードをコピー / 貼り付け
  - React コンポーネント / `path(d)`・SVG 中身 / `currentColor` 版 SVG / data URI / アイコン名
- ⭐ **お気に入り** と **最近使った**（セットごとに記憶）
- 🗂️ **カテゴリ絞り込み**と**全件ブラウズ**（スクロールで追加読込）
- 💾 セット/スタイル/塗り/太さ/色/サイズを**次回起動時も記憶**
- 🌓 一覧はテーマ（ライト / ダーク）に追従

## 使い方

1. Raycast を開き `Search Material Symbols` を実行
2. 検索バー右のメニューで **アイコンセット / スタイル**を選択（Material の 3 スタイル or Lucide）
3. アイコンを検索（例: `check`, `home`, `delete`, `arrow`）
4. アクション（一部）:

| ショートカット | 動作 |
| --- | --- |
| `Enter` | **既定アクション**（初期値=画像PNGを貼り付け / 設定で変更可） |
| `⌘⌥V` | 画像 (PNG) を貼り付け |
| `⌘⇧I` | 画像 (PNG) をコピー |
| `⌘C` | SVG コードをコピー |
| `⌘⇧V` | SVG を貼り付け |
| `⌘J` | React コンポーネントをコピー |
| `⌘⇧P` | path(d) / SVG 中身をコピー |
| `⌘U` | currentColor 版 SVG をコピー |
| `⌘D` | data URI をコピー |
| `⌘.` | アイコン名をコピー |
| `⌘⇧C` | 色を選択（プリセット / カスタム HEX） |
| `⌘⇧S` | サイズを選択 |
| `⌘F` | 塗り（FILL 0/1）切替 ※Material のみ |
| `⌘]` / `⌘[` | 太さ（Weight / Stroke）を増減 |
| `⌘⇧L` | カテゴリで絞り込み |
| `⌘⇧B` | お気に入りに追加 / 解除 |
| 検索バー右 | アイコンセット / スタイル切替 |

**Enter の既定アクション**は拡張設定（`⌘,`）の `Primary Action` で「画像PNG貼付 / 画像PNGコピー / SVGコピー / SVG貼付」から選べます。各見た目設定の初期値も設定で変更でき、以降は起動中の変更が記憶されます。

## 開発

```bash
npm install
npm run dev      # ray develop: Raycast に登録 + ホットリロード
npm run build    # ray build: 本番バンドル
npm run lint     # ray lint
```

> 開発モードを停止しても、拡張は Raycast に「Development」として残り、そのまま使えます。

## 仕組み

- **Material Symbols**: 15 万個の SVG 同梱を避け、**可変フォント 3 ファイル**を同梱し [`fontkit`](https://github.com/foliojs/fontkit) でグリフを取り出して SVG 化。軸 `FILL`/`wght`/`GRAD`/`opsz` を `getVariation()` で適用。フォント座標(Y-up, `unitsPerEm=960`)を `matrix(scale 0 0 -scale 0 24)` で 24×24 へ**焼き込み**、`transform` 無しのクリーンな `<path d>` を出力。
- **Lucide**: ストロークSVGの**子要素マークアップ**を `lucide.json` に同梱し、`fill="none" stroke=色 stroke-width=太さ` の `<svg>` でラップして生成。
- **PNG 化**: [`@resvg/resvg-wasm`](https://github.com/yisibl/resvg-js)（WASM 版）で実行。Raycast の esbuild はネイティブ `.node` を禁止するため、ネイティブ版ではなく WASM を `assets/resvg.wasm` から読み込む。
- 多段キャッシュ + ページング（スクロールで追加読込）で全件ブラウズ可能。

主なソース:

- `src/search-symbols.tsx` — Grid UI とアクション（2 セット対応）
- `src/lib/svg.ts` — Material 可変フォント → SVG 生成
- `src/lib/lucide.ts` — Lucide → SVG 生成
- `src/lib/png.ts` — SVG → PNG（WASM）
- `src/lib/format.ts` — React コンポーネント等の出力整形
- `src/lib/symbols.ts` — メタデータ読込・検索・カテゴリ（両セット共用の汎用検索）
- `src/components/ColorForm.tsx` — カスタム色入力フォーム

## アセット

| ファイル | 内容 |
| --- | --- |
| `assets/MaterialSymbols{Outlined,Rounded,Sharp}.ttf` | Material 可変フォント |
| `assets/symbols.json` | Material: `[name, codepoint, keywords, categories]` 人気順 |
| `assets/lucide.json` | Lucide: `[name, inner, keywords, categories]` |
| `assets/resvg.wasm` | PNG ラスタライズ用 WASM |
| `data-source/` | 生メタデータ（`assets/*.json` 再生成用、配布物には不要） |

## ライセンス / クレジット

- 拡張本体: MIT（`LICENSE`）
- **Material Symbols** フォント / アイコン: Apache License 2.0（`assets/FONT-LICENSE` / [google/material-design-icons](https://github.com/google/material-design-icons)）
- **Lucide** アイコン（Feather 由来分は MIT）: ISC License（`assets/LUCIDE-LICENSE` / [lucide-icons/lucide](https://github.com/lucide-icons/lucide)）
- **resvg**（`assets/resvg.wasm`, PNG 描画に使用）: MPL-2.0（`assets/RESVG-LICENSE` / [yisibl/resvg-js](https://github.com/yisibl/resvg-js)）

本拡張は Google / Lucide とは無関係の非公式ツールです（"Material Symbols" 等は各権利者の商標）。
