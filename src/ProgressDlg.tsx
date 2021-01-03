import {
  ContextualMenu,
  IDragOptions,
  Label,
  Modal,
  Stack,
  Text,
} from '@fluentui/react';
import { useRecoilValue } from 'recoil';
import './App.css';
import { computeState } from './Recoil/State';

export function ComputeStateProgress(): JSX.Element {
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
