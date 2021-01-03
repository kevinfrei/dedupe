import { IconButton } from '@fluentui/react';
import { CSSProperties } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import './App.css';
import { TrashFiles } from './ipc';
import {
  computeState,
  deletedFilesState,
  dupeFilesState,
} from './Recoil/State';

export function PickFileToDelete({
  files,
}: {
  files: Set<string>;
}): JSX.Element {
  // TODO: Use the source list ordering to prioritize the 'original' file
  const [deletedFiles, setDeletedFiles] = useRecoilState(deletedFilesState);
  const localDel = new Set([...files].filter((val) => deletedFiles.has(val)));
  // For files that have already been deleted
  const isDeleted = (name: string) => localDel.has(name);
  // For files where the rest of the dupe-set have been deleted
  const isSolo = (name: string) =>
    localDel.size === files.size - 1 && !localDel.has(name);
  // For files where this on is the 'preferred' file to hang on to
  const isPreferred = (name: string) => false;
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
  return (
    <ul>
      {[...files].map((name) => (
        <li key={name}>
          <IconButton
            iconProps={{ iconName: 'delete' }}
            disabled={isDeleted(name) || isSolo(name)}
            onClick={() => {
              // TODO: Verify if this is the preferred file
              TrashFiles(name);
              const newDelFiles = new Set(deletedFiles);
              newDelFiles.add(name);
              setDeletedFiles(newDelFiles);
            }}
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
  const style: CSSProperties = curState !== ' ' ? { display: 'none' } : {};
  // TODO: Add a "delete dupes of preferred files" button
  return (
    <div style={style}>
      <ul>
        {[...dupeFiles].map(([str, strSet]) => (
          <li key={str}>
            <PickFileToDelete files={strSet} />
          </li>
        ))}
      </ul>
    </div>
  );
}
