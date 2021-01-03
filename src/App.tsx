import { Checkbox, PrimaryButton } from '@fluentui/react';
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
  return <div>{curState}</div>;
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
