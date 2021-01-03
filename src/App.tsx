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
import { CSSProperties } from 'react';
import { RecoilRoot, useRecoilValue } from 'recoil';
import './App.css';
import { FolderList } from './FolderList';
import { InvokeMain } from './MyWindow';
import { Utilities } from './Recoil/Helpers';
import {
  computeState,
  dupeFilesState,
  foldersToScanState,
} from './Recoil/State';

function FolderPicker(): JSX.Element {
  const folders = useRecoilValue(foldersToScanState);
  const curState = useRecoilValue(computeState);
  const style: CSSProperties = curState === ' ' ? { display: 'none' } : {};
  return (
    <div style={style}>
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

function ComputeStateProgress(): JSX.Element {
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
          <Label>
            <Text variant="large">Calculation progress</Text>
          </Label>
          {txt.map((val, idx) => (
            <Text key={idx}>{`${val}${idx < txt.length - 1 ? '.' : ''}`}</Text>
          ))}
        </Stack>
      </div>
    </Modal>
  );
}

function DupeDisplay(): JSX.Element {
  const dupeFiles = useRecoilValue(dupeFilesState);
  const curState = useRecoilValue(computeState);
  const style: CSSProperties = curState !== ' ' ? { display: 'none' } : {};
  return (
    <div style={style}>
      <ul>
        {[...dupeFiles].map(([str, strArr]) => (
          <li key={str}>
            {str}: {strArr.length} total files
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function App() {
  return (
    <RecoilRoot>
      <Utilities />
      <FolderPicker />
      <ComputeStateProgress />
      <DupeDisplay />
    </RecoilRoot>
  );
}
