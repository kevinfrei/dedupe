import { Type } from '@freik/core-utils';
import { atom } from 'recoil';
import { bidirectionalSyncWithTranslateEffect } from './Helpers';

export type FolderSummary = { name: string; size?: number };

export const foldersToScanState = atom<FolderSummary[]>({
  key: 'folders',
  default: [],
  effects_UNSTABLE: [
    bidirectionalSyncWithTranslateEffect(
      (val) => val,
      (fton) => {
        if (
          Type.isArrayOf(fton, (obj): obj is FolderSummary =>
            Type.hasStr(obj, 'name'),
          )
        ) {
          return fton;
        }
      },
      true,
    ),
  ],
});
