import { IconButton, Label, PrimaryButton, Stack } from '@fluentui/react';
import { useRecoilState } from 'recoil';
import { ShowOpenDialog } from './MyWindow';
import { foldersToScanState, FolderSummary } from './Recoil/State';

function moveUp(folders: FolderSummary[], index: number): FolderSummary[] {
  const newArray = [...folders];
  newArray[index] = folders[index - 1];
  newArray[index - 1] = folders[index];
  return newArray;
}

function moveDown(folders: FolderSummary[], index: number): FolderSummary[] {
  const newArray = [...folders];
  newArray[index] = folders[index + 1];
  newArray[index + 1] = folders[index];
  return newArray;
}

function GetDirs(): string[] | void {
  return ShowOpenDialog({ properties: ['openDirectory'] });
}

export function FolderList(): JSX.Element {
  const [folders, setFolders] = useRecoilState(foldersToScanState);
  const theList =
    folders.length === 0 ? (
      <Label>&nbsp;Please add a folder</Label>
    ) : (
      folders.map((elem, index) => (
        <Stack horizontal key={elem.name}>
          <IconButton
            onClick={() => setFolders(folders.filter((val) => val !== elem))}
            iconProps={{ iconName: 'Delete' }}
          />
          <IconButton
            onClick={() => setFolders(moveUp(folders, index))}
            iconProps={{ iconName: 'Up' }}
            disabled={index === 0}
          />
          <IconButton
            onClick={() => setFolders(moveDown(folders, index))}
            iconProps={{ iconName: 'Down' }}
            disabled={index === folders.length - 1}
          />
          &nbsp;
          <Label>{elem.name}</Label>
        </Stack>
      ))
    );
  return (
    <div>
      {theList}
      <PrimaryButton
        text="Add a folder"
        onClick={() => {
          const locs = GetDirs();
          if (locs) {
            setFolders([...folders, ...locs.map((loc) => ({ name: loc }))]);
          }
        }}
      />
    </div>
  );
}
