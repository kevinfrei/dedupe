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

export const dupeFilesState = atom<Map<string, Set<string>>>({
  key: 'dupe-files',
  default: new Map(),
});

export const deletedFilesState = atom<Set<string>>({
  key: 'deleted-files',
  default: new Set(),
});
