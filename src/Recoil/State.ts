import { atom, atomFamily } from 'recoil';
import { syncWithMainEffect } from './Helpers';

export const foldersToScanState = atom<string[]>({
  key: 'folders',
  default: [],
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

export const dupeFilesState = atom<Map<string, string[]>>({
  key: 'dupe-files',
  default: new Map(),
});
