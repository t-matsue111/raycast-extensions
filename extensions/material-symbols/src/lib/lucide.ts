import { readFileSync } from "fs";
import { join } from "path";
import { environment } from "@raycast/api";

export interface LucideEntry {
  name: string;
  inner: string; // <svg> の内側の子要素マークアップ（例: <path d="..."/>）
  keywords: string;
  categories: string[];
}

let cache: LucideEntry[] | null = null;
let byName: Map<string, LucideEntry> | null = null;

/**
 * assets/lucide.json（name昇順のコンパクト配列）を読み込む。
 * 形式: [name, inner, keywords, categoriesPipe][]
 */
export function loadLucide(): LucideEntry[] {
  if (cache) return cache;
  const raw = readFileSync(join(environment.assetsPath, "lucide.json"), "utf8");
  const rows = JSON.parse(raw) as [string, string, string, string][];
  cache = rows.map(([name, inner, keywords, cats]) => ({
    name,
    inner,
    keywords,
    categories: cats ? cats.split("|").filter(Boolean) : [],
  }));
  byName = new Map(cache.map((e) => [e.name, e]));
  return cache;
}

export function getLucideByName(name: string): LucideEntry | undefined {
  if (!byName) loadLucide();
  return byName?.get(name);
}

export interface LucideSvgOptions {
  inner: string;
  color: string;
  size: number;
  strokeWidth: number;
}

/** Lucide のストロークSVGを生成（色=stroke, 太さ=stroke-width） */
export function buildLucideSvg(o: LucideSvgOptions): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${o.size}" height="${o.size}" viewBox="0 0 24 24" ` +
    `fill="none" stroke="${o.color}" stroke-width="${o.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">` +
    `${o.inner}</svg>`
  );
}
