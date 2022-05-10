import {
  newStorage,
  newWindow
} from './utils';

describe('single', () => {
  it('firstSessionTest', async () => {
    const browserSession = await newStorage(newWindow());

    browserSession.setItem('aaaa', 'abcdefg');
    expect(browserSession.getItem('aaaa')).toEqual('abcdefg');
  });
});
