import { MakeError, MakeLogger } from '@freik/core-utils';
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
export async function trashFile(flattenedPaths: string[]): Promise<void> {
  try {
    for (const file of flattenedPaths) {
      await fsp.unlink(file);
    }
    log('deleted files:');
    log(flattenedPaths);
    return;
  } catch (e) {
    err(`${flattenedPaths.join(', ')} doesn't appear to be formatted properly`);
  }
}
