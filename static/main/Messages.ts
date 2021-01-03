import { FTON, MakeError, Type } from '@freik/core-utils';
import { shell } from 'electron';
import trash from 'trash';

const err = MakeError('Messages-err');

export type Handler<T> = (arg?: string) => Promise<T | void>;

/**
 * Show a file in the shell
 * @param filePath - The path to the file to show
 */
export function showFile(filePath?: string): Promise<void> {
  return new Promise((resolve) => {
    if (filePath) {
      shell.showItemInFolder(filePath);
    }
    resolve();
  });
}

/**
 * Move a file to the trash, using a nodejs module someone else wrote for me :)
 */
export async function trashFile(flattenedPaths?: string): Promise<void> {
  if (!flattenedPaths) {
    err('No arg to trash-file');
    return;
  }
  let data;
  try {
    data = FTON.parse(flattenedPaths);
  } catch (e) {
    err(`${flattenedPaths} doesn't appear to be formatted properly`);
    err(e);
    return;
  }
  try {
    if (Type.isString(data) || Type.isArrayOfString(data)) {
      // TODO: Update the file list when the file has been deleted!
      await trash(data, { glob: false });
      return;
    }
  } catch (e) {
    err(`${flattenedPaths} doesn't appear to be formatted properly`);
  }
}
