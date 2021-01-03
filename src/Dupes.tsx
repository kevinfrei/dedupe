import { CSSProperties } from 'react';
import { useRecoilValue } from 'recoil';
import './App.css';
import { computeState, dupeFilesState } from './Recoil/State';

export function DupeDisplay(): JSX.Element {
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
