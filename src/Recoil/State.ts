import { atom } from 'recoil';

export const foldersToScanState = atom<string[]>({
  key: 'folders',
  default: [],
});
