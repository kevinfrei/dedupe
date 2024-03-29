import { MakeMultiMap, MultiMap } from '@freik/core-utils';
import { atom, atomFamily } from 'recoil';
import { syncWithMainEffect } from './Helpers';

export const foldersToScanState = atom<string[]>({
  key: 'folders',
  default: [],
  // eslint-disable-next-line @typescript-eslint/naming-convention
  effects_UNSTABLE: [syncWithMainEffect(true)],
});

export const folderFileCountFamily = atomFamily<number, string>({
  key: 'fileCount',
  default: (folder) => -1,
});

export const computeState = atom<string>({
  key: 'compute-state',
  default: '',
});

export const dupeFilesState = atom<MultiMap<string, string>>({
  key: 'dupe-files',
  default: MakeMultiMap(),
});

export const deletedFilesState = atom<Set<string>>({
  key: 'deleted-files',
  default: new Set(),
});
