import { readFileSync } from "fs";
import { join } from "path";
import { environment } from "@raycast/api";
import * as fontkit from "fontkit";

export type SymbolStyle = "outlined" | "rounded" | "sharp";

/** Material Symbols の可変軸。FILL/wght/GRAD/opsz に対応 */
export interface Axes {
  fill: number; // 0 | 1
  weight: number; // 100..700
  grade: number; // -50..200 (既定 0)
  opsz: number; // 20..48 (既定 24)
}

const FONT_FILES: Record<SymbolStyle, string> = {
  outlined: "MaterialSymbolsOutlined.ttf",
  rounded: "MaterialSymbolsRounded.ttf",
  sharp: "MaterialSymbolsSharp.ttf",
};

/** Material 公式の描画グリッド（viewBox は常に 0 0 24 24） */
const GRID = 24;

/**
 * fontkit の型定義は可変フォント系のメソッドを完全には網羅しないため、
 * 実際に使う部分だけを最小限の形で扱う。
 */
type FontLike = {
  unitsPerEm: number;
  hasGlyphForCodePoint(codePoint: number): boolean;
  glyphForCodePoint(codePoint: number): { path: { toSVG(): string } };
  getVariation(settings: Record<string, number>): FontLike;
};

const fontkitCreate = (
  fontkit as unknown as { create(buffer: Buffer): FontLike }
).create;

const fontCache = new Map<SymbolStyle, FontLike>();
const variationCache = new Map<string, FontLike>();
const pathCache = new Map<string, string | null>(); // font座標の生パス
const cleanPathCache = new Map<string, string | null>(); // 24x24に焼き込んだパス

/** スタイルごとに可変フォント本体を一度だけ読み込んでキャッシュ */
function loadFont(style: SymbolStyle): FontLike {
  let font = fontCache.get(style);
  if (!font) {
    const buffer = readFileSync(
      join(environment.assetsPath, FONT_FILES[style]),
    );
    font = fontkitCreate(buffer);
    fontCache.set(style, font);
  }
  return font;
}

function variationKey(style: SymbolStyle, axes: Axes): string {
  return `${style}|${axes.fill}|${axes.weight}|${axes.grade}|${axes.opsz}`;
}

/** 軸の組合せごとにバリエーション・インスタンスをキャッシュ */
function getVariation(style: SymbolStyle, axes: Axes): FontLike {
  const key = variationKey(style, axes);
  let variation = variationCache.get(key);
  if (!variation) {
    variation = loadFont(style).getVariation({
      FILL: axes.fill,
      wght: axes.weight,
      GRAD: axes.grade,
      opsz: axes.opsz,
    });
    variationCache.set(key, variation);
  }
  return variation;
}

/** グリフの輪郭パス（font 座標, Y-up）を取得。未収録なら null。 */
function getRawPath(
  style: SymbolStyle,
  axes: Axes,
  codePoint: number,
): string | null {
  const key = `${variationKey(style, axes)}|${codePoint}`;
  const cached = pathCache.get(key);
  if (cached !== undefined) return cached;

  // 未収録コードポイントは .notdef の四角になるため事前に弾く
  if (!loadFont(style).hasGlyphForCodePoint(codePoint)) {
    pathCache.set(key, null);
    return null;
  }
  const d = getVariation(style, axes).glyphForCodePoint(codePoint).path.toSVG();
  pathCache.set(key, d);
  return d;
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * font 座標(Y-up, 0..unitsPerEm)のパスを matrix(scale 0 0 -scale 0 GRID) で
 * 24x24(Y-down) 座標に焼き込み、transform 属性なしのクリーンな d を返す。
 * fontkit のグリフパスは M/L/Q/C/Z（絶対座標）のみなので座標ペア単位で変換できる。
 */
function bakeMatrix(d: string, scale: number): string {
  return d.replace(
    /([MLQCZ])([^MLQCZ]*)/gi,
    (_match, cmd: string, args: string) => {
      if (cmd.toUpperCase() === "Z") return "Z";
      const nums = (args.match(/-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) || []).map(
        Number,
      );
      const out: number[] = [];
      for (let i = 0; i < nums.length; i += 2) {
        out.push(round(scale * nums[i]), round(GRID - scale * nums[i + 1]));
      }
      return cmd + out.join(" ");
    },
  );
}

/** 24x24 座標系のクリーンなパス d を取得（path/コンポーネント出力用）。未収録なら null。 */
export function getCleanPath(
  style: SymbolStyle,
  axes: Axes,
  codePoint: number,
): string | null {
  const key = `${variationKey(style, axes)}|${codePoint}`;
  const cached = cleanPathCache.get(key);
  if (cached !== undefined) return cached;

  const raw = getRawPath(style, axes, codePoint);
  if (raw === null) {
    cleanPathCache.set(key, null);
    return null;
  }
  const scale = GRID / loadFont(style).unitsPerEm; // 例: 24/960 = 0.025
  const clean = bakeMatrix(raw, scale);
  cleanPathCache.set(key, clean);
  return clean;
}

export interface BuildSvgOptions {
  style: SymbolStyle;
  codePoint: number;
  axes: Axes;
  color: string;
  size: number;
}

/**
 * 指定スタイル・軸・色・サイズの SVG 文字列を生成する。未収録アイコンは null。
 */
export function buildSvg(options: BuildSvgOptions): string | null {
  const d = getCleanPath(options.style, options.axes, options.codePoint);
  if (d === null) return null;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${options.size}" height="${options.size}" viewBox="0 0 ${GRID} ${GRID}">` +
    `<path d="${d}" fill="${options.color}"/>` +
    `</svg>`
  );
}

/** SVG 文字列を data URI（base64）に変換 */
export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
