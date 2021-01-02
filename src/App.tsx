import { RecoilRoot } from 'recoil';
import './App.css';
import { Utilities } from './Recoil/Helpers';

function App() {
  return (
    <RecoilRoot>
      <Utilities />
      <div>
        <ul>
          <li>This should</li>
          <li>Be a list</li>
          <li>of folders to scan</li>
        </ul>
      </div>
      <div>And this is an "add a folder" button</div>
      <div>And finally, the "Start scanning" button!</div>
    </RecoilRoot>
  );
}

export default App;
