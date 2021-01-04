import { FTON, MakeError, MakeLogger, Type } from '@freik/core-utils';
import { shell } from 'electron';
import { promises as fsp } from 'fs';

const log = MakeLogger('Messages', true);
const err = MakeError('Messages-err');

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
    if (Type.isString(data)) {
      // TODO: Update the file list when the file has been deleted!
      await fsp.unlink(data);
      log('deleted files:');
      log(data);
      return;
    }
    if (Type.isArrayOfString(data)) {
      // TODO: Update the file list when the file has been deleted!
      for (const file of data) {
        await fsp.unlink(file);
      }
      log('deleted files:');
      log(data);
      return;
    }
  } catch (e) {
    err(`${flattenedPaths} doesn't appear to be formatted properly`);
  }
}
