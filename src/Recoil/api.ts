import { Type } from '@freik/core-utils';
import { CallbackInterface } from 'recoil';
import { TrashFiles } from '../ipc';
import { deletedFilesState } from './State';

export async function RemoveFiles(
  { set }: CallbackInterface,
  files: string | string[],
): Promise<void> {
  await TrashFiles(files);
  set(deletedFilesState, (prv: Set<string>) => {
    const newDelFiles = new Set(prv);
    for (const file of Type.isString(files) ? [files] : files) {
      newDelFiles.add(file);
    }
    return newDelFiles;
  });
}
