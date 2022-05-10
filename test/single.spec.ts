import {
  newStorage,
  newWindow
} from './utils';
import {BrowserSession} from "../lib";

describe('single', () => {
  it('firstSessionTest', async () => {
    const window = await newWindow();
    const browserSession = await newStorage(window);

    browserSession.setItem('aaaa', 'abcdefg');
    expect(browserSession.getItem('aaaa')).toEqual('abcdefg');

    expect(window.localStorage.getItem('aaaa')).not.toBeNull();
    expect(window.sessionStorage.getItem(BrowserSession.STORAGE_SECRET_KEY_NAME)).not.toBeNull();
  });
});
