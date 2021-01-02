import { Checkbox, PrimaryButton } from '@fluentui/react';
import { useRecoilValue } from 'recoil';
import './App.css';
import { FolderList } from './FolderList';
import { Utilities } from './Recoil/Helpers';
import { foldersToScanState } from './Recoil/State';

function App() {
  const folders = useRecoilValue(foldersToScanState);
  return (
    <div style={{ margin: 10 }}>
      <Utilities />
      <FolderList />
      <div style={{ margin: 10 }}>
        <Checkbox label="Do quick 'check' pass before full file hashing" />
      </div>
      <PrimaryButton text="Start Scanning" disabled={folders.length === 0} />
    </div>
  );
}

export default App;
