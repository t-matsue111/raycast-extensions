/** アイコン名(snake)を PascalCase に。先頭が数字なら接頭辞を付けて識別子として有効化。 */
export function toPascalCase(name: string): string {
  const pascal = name
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  return /^[0-9]/.test(pascal) ? `Symbol${pascal}` : pascal;
}

/** 24x24 のパス d から React(JSX) コンポーネント文字列を生成（currentColor + props 展開） */
export function toReactComponent(name: string, pathD: string): string {
  const componentName = `${toPascalCase(name)}Icon`;
  return (
    `export const ${componentName} = (props: React.SVGProps<SVGSVGElement>) => (\n` +
    `  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>\n` +
    `    <path d="${pathD}" />\n` +
    `  </svg>\n` +
    `);\n`
  );
}

/** Lucide の inner(子要素) から React(JSX) コンポーネント文字列を生成（stroke ベース） */
export function toLucideComponent(name: string, inner: string): string {
  const componentName = `${toPascalCase(name)}Icon`;
  return (
    `export const ${componentName} = (props: React.SVGProps<SVGSVGElement>) => (\n` +
    `  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>\n` +
    `    ${inner}\n` +
    `  </svg>\n` +
    `);\n`
  );
}
