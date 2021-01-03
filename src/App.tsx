import {
  Checkbox,
  ContextualMenu,
  IDragOptions,
  Label,
  Modal,
  PrimaryButton,
  Stack,
  Text,
} from '@fluentui/react';
import { RecoilRoot, useRecoilValue } from 'recoil';
import './App.css';
import { FolderList } from './FolderList';
import { InvokeMain } from './MyWindow';
import { Utilities } from './Recoil/Helpers';
import { computeState, foldersToScanState } from './Recoil/State';

function FolderPicker(): JSX.Element {
  const folders = useRecoilValue(foldersToScanState);
  const curState = useRecoilValue(computeState);
  return (
    <div>
      <FolderList />
      <div style={{ margin: 10 }}>
        <Checkbox label="Do quick 'check' pass before full file hashing" />
      </div>
      <PrimaryButton
        text="Start Scanning"
        disabled={folders.length === 0 || curState !== ''}
        onClick={() => InvokeMain('start-scan')}
      />
    </div>
  );
}

function StateDisplay(): JSX.Element {
  const curState = useRecoilValue(computeState);
  if (curState.trim().length === 0) {
    return <></>;
  }
  const dragOptions: IDragOptions = {
    moveMenuItemText: 'Move',
    closeMenuItemText: 'Close',
    menu: ContextualMenu,
    keepInBounds: true,
  };
  const txt = curState.trim().split('. ');
  return (
    <Modal isOpen isBlocking dragOptions={dragOptions}>
      <div style={{ margin: 10 }}>
        <Stack>
          <Label>Calculation progress</Label>
          {txt.map((val, idx) => (
            <Text key={idx}>{`${val}${idx < txt.length - 1 ? '.' : ''}`}</Text>
          ))}
        </Stack>
      </div>
    </Modal>
  );
}

export default function App() {
  return (
    <RecoilRoot>
      <Utilities />
      <FolderPicker />
      <StateDisplay />
    </RecoilRoot>
  );
}
