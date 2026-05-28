/**
 * package.json の dependencies から OSS ライセンス表示用 JSON を生成するスクリプト。
 *
 * 実行:
 *   pnpm generate:licenses
 *   node scripts/generate-oss-licenses.mjs
 *
 * 入力:
 *   package.json
 *   node_modules/<package>/package.json
 *   node_modules/<package>/LICENSE*
 *
 * 出力:
 *   src/features/licenses/data/ossLicenses.json
 *
 * 注意:
 *   devDependencies は対象外。アプリの配布物に含まれる dependencies のみを一覧化する。
 *   LICENSE ファイルが見つからない場合は licenseText を空文字にする。
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const packageJsonPath = path.join(rootDir, 'package.json');
const outputPath = path.join(rootDir, 'src/features/licenses/data/ossLicenses.json');
const licenseFileNames = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'LICENCE.md'];

const readJson = async (filePath) => JSON.parse(await readFile(filePath, 'utf8'));

const packageJson = await readJson(packageJsonPath);
const dependencies = Object.keys(packageJson.dependencies ?? {}).sort((a, b) => a.localeCompare(b));

const findPackageDir = (packageName) => path.join(rootDir, 'node_modules', packageName);

const findLicenseFile = (packageDir) =>
  licenseFileNames
    .map((fileName) => path.join(packageDir, fileName))
    .find((filePath) => existsSync(filePath));

const extractCopyrights = (licenseText, packageMeta) => {
  const matches = licenseText.match(/^copyright.*$/gim);
  if (matches?.length) return [...new Set(matches.map((item) => item.trim()))];
  if (typeof packageMeta.author === 'string') return [packageMeta.author];
  if (packageMeta.author?.name) return [packageMeta.author.name];
  return [];
};

const entries = await Promise.all(
  dependencies.map(async (packageName) => {
    const packageDir = findPackageDir(packageName);
    const packageMeta = await readJson(path.join(packageDir, 'package.json'));
    const licenseFile = findLicenseFile(packageDir);
    const licenseText = licenseFile ? (await readFile(licenseFile, 'utf8')).trim() : '';

    return {
      name: packageMeta.name ?? packageName,
      version: packageMeta.version ?? '',
      license: packageMeta.license ?? 'Unknown',
      copyrights: extractCopyrights(licenseText, packageMeta),
      licenseText,
    };
  }),
);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`);
