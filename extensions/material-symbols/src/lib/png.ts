import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { environment } from "@raycast/api";
import { initWasm, Resvg } from "@resvg/resvg-wasm";

// Raycast の esbuild はネイティブ .node を禁止するため、WASM 版 resvg を使う。
// .wasm は assets から読み込んで初回だけ初期化する（initWasm は一度きり）。
let wasmReady: Promise<void> | null = null;
function ensureWasm(): Promise<void> {
  if (!wasmReady) {
    const wasm = readFileSync(join(environment.assetsPath, "resvg.wasm"));
    wasmReady = initWasm(wasm);
  }
  return wasmReady;
}

/** SVG 文字列を指定幅(px)の PNG バッファにラスタライズ */
export async function svgToPng(svg: string, widthPx: number): Promise<Buffer> {
  await ensureWasm();
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: Math.max(1, Math.round(widthPx)) },
  });
  return Buffer.from(resvg.render().asPng());
}

/**
 * PNG を supportPath に書き出してファイルパスを返す（画像コピー/貼り付け用）。
 * 同名で上書きするので一時ファイルが溜まらない。
 */
export async function writePngFile(
  svg: string,
  widthPx: number,
  basename: string,
): Promise<string> {
  if (!existsSync(environment.supportPath)) {
    mkdirSync(environment.supportPath, { recursive: true });
  }
  const safe = basename.replace(/[^a-z0-9_-]/gi, "_");
  const path = join(environment.supportPath, `${safe}.png`);
  writeFileSync(path, await svgToPng(svg, widthPx));
  return path;
}
