import { initializeIcons } from '@uifabric/icons';
import { act, create } from 'react-test-renderer';
import App from '../App';

jest.mock('../MyWindow');

test('renders learn react link', async () => {
  initializeIcons();
  await act(async () => {
    const root = create(<App />);
    expect(root).toBeTruthy();
    return new Promise((res, rej) => res());
  });
});
