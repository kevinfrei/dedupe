import { RecoilRoot } from 'recoil';
import './App.css';
import { DupeDisplay } from './Dupes';
import { FolderPicker } from './FolderList';
import { ComputeStateProgress } from './ProgressDlg';
import { Utilities } from './Recoil/Helpers';

export default function App(): JSX.Element {
  return (
    <RecoilRoot>
      <Utilities />
      <FolderPicker />
      <ComputeStateProgress />
      <DupeDisplay />
    </RecoilRoot>
  );
}
