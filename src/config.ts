import { cosmiconfig } from 'cosmiconfig';

export function getConfig() {
  const explorer = cosmiconfig('toro-tools');
  return explorer
    .search()
    .then((result) => {
      if (!result?.config) {
        throw Error('failed to find config file');
      }
      return result?.config as {
        includeDirs: Array<string>;
        outDir: string;
      };
    })
    .catch(() => {
      throw Error('failed to find config file');
    });
}
