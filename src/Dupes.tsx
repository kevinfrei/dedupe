import { IconButton, PrimaryButton } from '@fluentui/react';
import { CSSProperties } from 'react';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import './App.css';
import { RemoveFiles } from './Recoil/api';
import {
  computeState,
  deletedFilesState,
  dupeFilesState,
  foldersToScanState,
} from './Recoil/State';

type PriList = { priority: number; name: string }[];

function makePriList(set: Set<string>, priority: string[]): PriList {
  const result = [];
  for (const nm of set) {
    for (let i = 0; i < priority.length; i++) {
      if (nm.toLocaleLowerCase().startsWith(priority[i].toLowerCase())) {
        result.push({ priority: i, name: nm });
        break;
      }
    }
  }
  return result.sort((a, b) => a.priority - b.priority);
}

function isOnlyPreferred(name: string, priList: PriList): boolean {
  return (
    priList.length < 2 ||
    (priList[0].name === name && priList[1].priority > priList[0].priority)
  );
}

export function PickFileToDelete({
  files,
}: {
  files: Set<string>;
}): JSX.Element {
  // TODO: Use the source list ordering to prioritize the 'original' file
  const deletedFiles = useRecoilValue(deletedFilesState);
  const localDel = new Set([...files].filter((val) => deletedFiles.has(val)));
  const foldersToScan = useRecoilValue(foldersToScanState);

  const priList = makePriList(files, foldersToScan);
  // For files that have already been deleted
  const isDeleted = (name: string) => localDel.has(name);
  // For files where the rest of the dupe-set have been deleted
  const isSolo = (name: string) =>
    localDel.size === files.size - 1 && !localDel.has(name);
  // For files where this on is the 'preferred' file to hang on to
  const isPreferred = (name: string) => isOnlyPreferred(name, priList);
  const pickStyle = (name: string): CSSProperties => {
    if (isSolo(name)) {
      return {};
    }
    if (isDeleted(name)) {
      return { textDecoration: 'line-through' };
    }
    // TODO: { fontWeight: 'bold' } for the 'preferred to keep' file
    return isPreferred(name) ? { fontWeight: 'bold' } : {};
  };

  const onTrashClick = useRecoilCallback(
    (cbInterface) => async (name: string) => {
      // TODO: Verify if you try to delete the preferred item...
      await RemoveFiles(cbInterface, name);
    },
  );

  return (
    <ul>
      {[...files].map((name) => (
        <li key={name}>
          <IconButton
            iconProps={{ iconName: 'delete' }}
            disabled={isDeleted(name) || isSolo(name)}
            onClick={() => onTrashClick(name)}
          />
          <span style={pickStyle(name)}>{name}</span>
        </li>
      ))}
    </ul>
  );
}

export function DupeDisplay(): JSX.Element {
  const dupeFiles = useRecoilValue(dupeFilesState);
  const curState = useRecoilValue(computeState);
  const foldersToScan = useRecoilValue(foldersToScanState);

  const style: CSSProperties = curState !== ' ' ? { display: 'none' } : {};
  // TODO: Add a "delete dupes of preferred files" button
  const internal = (
    <ul>
      {[...dupeFiles].map(([str, strSet]) => (
        <li key={str}>
          <PickFileToDelete files={new Set<string>(...strSet)} />
        </li>
      ))}
    </ul>
  );
  const onRemoveAlts = useRecoilCallback((cbInterface) => async () => {
    for (const [, dupeFileSet] of dupeFiles) {
      const priList = makePriList(
        new Set<string>(...dupeFileSet),
        foldersToScan,
      );
      if (priList.length && isOnlyPreferred(priList[0].name, priList)) {
        await RemoveFiles(
          cbInterface,
          priList.filter((v, i) => i !== 0).map((v) => v.name),
        );
      }
    }
  });
  return (
    <div style={style}>
      <PrimaryButton text="Remove alternatives" onClick={onRemoveAlts} />
      {dupeFiles.size() === 0 ? 'No duplicates found' : internal}
    </div>
  );
}
