import { act, create } from 'react-test-renderer';
import { RecoilRoot } from 'recoil';
import App from '../App';

test('renders learn react link', () => {
  act(() => {
    const root = create(
      <RecoilRoot>
        <App />
      </RecoilRoot>,
    );
    expect(root).toBeTruthy();
  });
});
