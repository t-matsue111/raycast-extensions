import { readFileSync } from "fs";
import { join } from "path";
import { environment } from "@raycast/api";

export interface SymbolEntry {
  name: string;
  codePoint: number; // 数値（例: 0xe5ca）
  keywords: string; // 小文字・空白区切りの検索語（tags + categories）
  categories: string[]; // 正規化済みカテゴリ
}

let cache: SymbolEntry[] | null = null;
let byName: Map<string, SymbolEntry> | null = null;

/**
 * assets/symbols.json（人気度降順のコンパクト配列）を読み込む。
 * 形式: [name, codepointHex, keywords, categoriesPipe][]
 */
export function loadSymbols(): SymbolEntry[] {
  if (cache) return cache;
  const raw = readFileSync(
    join(environment.assetsPath, "symbols.json"),
    "utf8",
  );
  const rows = JSON.parse(raw) as [string, string, string, string][];
  cache = rows.map(([name, hex, keywords, cats]) => ({
    name,
    codePoint: parseInt(hex, 16),
    keywords,
    categories: cats ? cats.split("|").filter(Boolean) : [],
  }));
  byName = new Map(cache.map((e) => [e.name, e]));
  return cache;
}

/** 名前から SymbolEntry を引く（お気に入り/最近使った の復元用） */
export function getByName(name: string): SymbolEntry | undefined {
  if (!byName) loadSymbols();
  return byName?.get(name);
}

/** 全カテゴリを件数の多い順に返す（Material/Lucide 共用） */
export function listCategories<T extends { categories: string[] }>(
  pool: T[],
): string[] {
  const count = new Map<string, number>();
  for (const e of pool)
    for (const c of e.categories) count.set(c, (count.get(c) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
}

/**
 * 簡易スコアリング検索。pool は人気度降順なので、同点は人気順で並ぶ。
 * name 完全一致 > name 前方一致 > name 部分一致 > 全語が name に含む > 全語が name/keywords に含む。
 */
export function searchSymbols<T extends { name: string; keywords: string }>(
  pool: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return pool;

  const terms = q.split(/\s+/).filter(Boolean);
  const qUnderscore = q.replace(/\s+/g, "_");

  const scored: { entry: T; score: number; order: number }[] = [];
  for (let i = 0; i < pool.length; i++) {
    const entry = pool[i];
    const name = entry.name;
    let score = 0;
    if (name === qUnderscore) score = 1000;
    else if (name.startsWith(qUnderscore)) score = 700;
    else if (name.includes(qUnderscore)) score = 500;
    else if (terms.every((t) => name.includes(t))) score = 300;
    else if (terms.every((t) => name.includes(t) || entry.keywords.includes(t)))
      score = 100;

    if (score > 0) scored.push({ entry, score, order: i });
  }

  scored.sort((a, b) => b.score - a.score || a.order - b.order);
  return scored.map((s) => s.entry);
}
