import { IconButton, Label, PrimaryButton, Stack } from '@fluentui/react';
import { CSSProperties } from 'react';
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';
import './App.css';
import { InvokeMain, ShowOpenDialog } from './MyWindow';
import {
  computeState,
  folderFileCountFamily,
  foldersToScanState,
} from './Recoil/State';

export function FolderPicker(): JSX.Element {
  const folders = useRecoilValue(foldersToScanState);
  const curState = useRecoilValue(computeState);
  const style: CSSProperties = curState === ' ' ? { display: 'none' } : {};
  return (
    <div style={style}>
      <FolderList />
      <PrimaryButton
        text="Start Scanning"
        disabled={folders.length === 0 || curState !== ''}
        onClick={() => InvokeMain('start-scan')}
      />
    </div>
  );
}

function FolderDetail({ name }: { name: string }): JSX.Element {
  const folderSize = useRecoilValue(folderFileCountFamily(name));
  if (folderSize >= 0) {
    return (
      <Label>
        {name}: {folderSize} files
      </Label>
    );
  } else {
    return <Label>{name}</Label>;
  }
}

function moveUp(folders: string[], index: number): string[] {
  const newArray = [...folders];
  newArray[index] = folders[index - 1];
  newArray[index - 1] = folders[index];
  return newArray;
}

function moveDown(folders: string[], index: number): string[] {
  const newArray = [...folders];
  newArray[index] = folders[index + 1];
  newArray[index + 1] = folders[index];
  return newArray;
}

async function GetDirs(): Promise<string[] | void> {
  return ShowOpenDialog({ properties: ['openDirectory'] });
}

export function FolderList(): JSX.Element {
  const [folders, setFolders] = useRecoilState(foldersToScanState);
  const curState = useRecoilValue(computeState);
  const onAddFolderClick = useRecoilCallback(({ set }) => async () => {
    const locs = await GetDirs();
    if (locs) {
      set(foldersToScanState, (prv) => [...prv, ...locs]);
    }
  });
  const theList =
    folders.length === 0 ? (
      <Label>&nbsp;Please add a folder</Label>
    ) : (
      folders.map((elem, index) => (
        <Stack horizontal key={elem}>
          <IconButton
            onClick={() => setFolders(folders.filter((val) => val !== elem))}
            iconProps={{ iconName: 'Delete' }}
            disabled={curState !== ''}
          />
          <IconButton
            onClick={() => setFolders(moveUp(folders, index))}
            iconProps={{ iconName: 'Up' }}
            disabled={index === 0 || curState !== ''}
          />
          <IconButton
            onClick={() => setFolders(moveDown(folders, index))}
            iconProps={{ iconName: 'Down' }}
            disabled={index === folders.length - 1 || curState !== ''}
          />
          &nbsp;
          <FolderDetail name={elem} />
        </Stack>
      ))
    );
  return (
    <div>
      {theList}
      <PrimaryButton
        text="Add a folder"
        onClick={onAddFolderClick}
        disabled={curState !== ''}
      />
    </div>
  );
}
