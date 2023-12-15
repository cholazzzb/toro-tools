import { outputFile, readdirSync, statSync } from 'fs-extra';
import { join, sep } from 'node:path';
import { getConfig } from './config';

type Extension = string;
type PathFiles = Record<string, string>;

const rootDir = process.cwd();
const rootDirLen = process.cwd().split(sep).length;

// Helper Function
const pathFilesToString = (pathFiles: PathFiles): string => {
  let result = '';

  for (const key of Object.keys(pathFiles)) {
    const keys = key.split('/');

    result += `export { default as ${snakeCaseToTitleCase(
      keys.slice(-2).join('-'),
    )} } from '${pathFiles[key]}';\n`;
  }

  return result;
};

export const snakeCaseToCamelCase = (str: string) =>
  str.replace(/^(.)|-+(.)/g, (_, p1, p2) =>
    p1 ? p1.toLowerCase() : `${p2.toUpperCase()}`,
  );

export const snakeCaseToTitleCase = (str: string) =>
  str.replace(/^(.)|-+(.)/g, (_, p1, p2) =>
    p1 ? p1.toUpperCase() : `${p2.toUpperCase()}`,
  );

const getExtension = (filename: string): Extension => {
  const fileNameSplit = filename.split('.');
  return fileNameSplit[fileNameSplit.length - 1];
};

const isSVG = (ext: Extension) => ext === 'svg';

// Script Start Here
const whiteList = new Set([
  'png',
  'ico',
  'svg',
  'jpg',
  'jpeg',
  'wasm',
  'mp3',
  'wav',
  'json',
]);

const pathFiles: PathFiles = {};
const svgPathFiles: PathFiles = {};

const fillPathFiles = (filePath = '') => {
  // use filepath.split with path.sep to support windows
  const paths = filePath.split(sep);
  const fileName = paths[paths.length - 1];
  const fileNameOnly = fileName.split('.')[0] ?? '';

  // NOTE: we don't need this to change to path.sep since
  // the script that consume json wants it to be POSIX
  const key = [
    ...paths
      .slice(rootDirLen + 2, paths.length - 1)
      .map((str) => snakeCaseToCamelCase(str)),
    snakeCaseToCamelCase(fileNameOnly),
  ].join('/');
  pathFiles[key] = ['', ...paths.slice(rootDirLen + 1)].join('/');
};

const fillSVGPathFiles = (filePath = '') => {
  // use filepath.split with path.sep to support windows
  const paths = filePath.split(sep);
  const fileName = paths[paths.length - 1];
  const fileNameOnly = fileName.split('.')[0] ?? '';

  // NOTE: we don't need this to change to path.sep since
  // the script that consume json wants it to be POSIX
  const key = [
    ...paths
      .slice(rootDirLen + 1, paths.length - 1)
      .map((str) => snakeCaseToCamelCase(str)),
    snakeCaseToCamelCase(fileNameOnly),
  ].join('/');

  svgPathFiles[key] = ['', ...paths.slice(rootDirLen)].join('/');
};

function walkDir(dir: string) {
  readdirSync(dir).forEach((fileName) => {
    const dirPath = join(dir, fileName);

    const isDirectory = statSync(dirPath).isDirectory();

    if (isDirectory) {
      walkDir(dirPath);
    } else if (whiteList.has(getExtension(fileName))) {
      if (isSVG(getExtension(fileName))) {
        fillSVGPathFiles(dirPath);
      }

      fillPathFiles(dirPath);
    }
  });
}

export default async function collectAssets() {
  const config = await getConfig();
  config.includeDirs.forEach((dir) => {
    walkDir(join(rootDir, ...dir.split('/')));
  });

  outputFile(
    join(...config.outDir.split('/'), 'assets.json'),
    JSON.stringify(pathFiles, null, 2),
  );

  outputFile(
    join(...config.outDir.split('/'), 'assetsSVG.ts'),
    pathFilesToString(svgPathFiles),
  );
}

collectAssets();
