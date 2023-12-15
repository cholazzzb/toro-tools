import { outputFile } from 'fs-extra';
import { join } from 'node:path';

const config = {
  includeDirs: ['public/assets/svg'],
  outDir: 'src/__generated__/assets',
};

const path = process.cwd();

outputFile(join(path, '.toro-toolsrc'), JSON.stringify(config, null, 2));
