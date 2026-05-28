/**
 * feature-based 構成の import 境界を検査するスクリプト。
 *
 * 実行:
 *   pnpm lint
 *   node scripts/check-boundaries.mjs
 *
 * 出力:
 *   違反がなければ何も出力せず exit 0。
 *   違反があれば標準エラーに `file: reason` 形式で一覧を出力し exit 1。
 *
 * 検査内容:
 *   - feature から app/store へ依存しない
 *   - app/components/hooks/store は feature の barrel (`@/features/foo`) 経由で import する
 *   - feature 間の依存も相手 feature の barrel 経由に限定する
 */
import { globSync, readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const boundaryFilePattern = new URL(
  '../src/{app,components,features,hooks,store}/**/*.{ts,tsx}',
  import.meta.url,
);
const importPattern = /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
const featureNamePattern = /^src\/features\/([^/]+)\//;
const appFilePattern = /^src\/app\//;
const sharedLayerFilePattern = /^src\/(?:components|hooks|store)\//;
const deepFeatureImportPattern = /^@\/features\/([^/]+)\//;

const files = globSync(fileURLToPath(boundaryFilePattern), {
  exclude: (path) => path.includes('.test.') || path.includes('/__tests__/'),
});

const violations = [];

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const normalizedFile = relative(root, file).replaceAll('\\', '/');
  const currentFeature = normalizedFile.match(featureNamePattern)?.[1];
  const isAppFile = appFilePattern.test(normalizedFile);
  const isSharedLayerFile = sharedLayerFilePattern.test(normalizedFile);
  if (!currentFeature && !isAppFile && !isSharedLayerFile) continue;

  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    if (!specifier) continue;

    if (specifier.startsWith('@/app/')) {
      violations.push(`${normalizedFile}: feature code must not import app module "${specifier}"`);
      continue;
    }
    if (currentFeature && specifier.startsWith('@/store/')) {
      violations.push(`${normalizedFile}: feature code must not import store module "${specifier}"`);
      continue;
    }

    const importedFeature = specifier.match(deepFeatureImportPattern)?.[1];
    if ((isAppFile || isSharedLayerFile) && importedFeature) {
      violations.push(
        `${normalizedFile}: top-level layer code must import features through their barrel, not "${specifier}"`,
      );
      continue;
    }

    if (importedFeature && importedFeature !== currentFeature) {
      violations.push(
        `${normalizedFile}: import other features through their barrel, not "${specifier}"`,
      );
    }
  }
}

if (violations.length > 0) {
  console.error(violations.join('\n'));
  process.exit(1);
}
