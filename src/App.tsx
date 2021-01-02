import { PrimaryButton } from '@fluentui/react';
import { useRecoilValue } from 'recoil';
import './App.css';
import { FolderList } from './FolderList';
import { Utilities } from './Recoil/Helpers';
import { foldersToScanState } from './Recoil/State';

function App() {
  const folders = useRecoilValue(foldersToScanState);
  return (
    <div>
      <Utilities />
      <FolderList />
      <PrimaryButton text="Start Scanning" disabled={folders.length === 0} />
    </div>
  );
}

export default App;
