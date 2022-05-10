import {
  BrowserSession
} from '../src';

function newStorage(): Promise<BrowserSession> {
  const storage = new BrowserSession({
    timeout: 100
  });
  return storage.start(window)
      .then(() => storage);
}

describe('single', () => {
  it('firstSessionTest', async () => {
    const browserSession = await newStorage();

    browserSession.setItem('aaaa', 'abcdefg');
    expect(browserSession.getItem('aaaa')).toEqual('abcdefg');
  });
});
