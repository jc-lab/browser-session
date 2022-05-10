import {
  newStorage,
  newWindow
} from './utils';
import {BrowserSession} from '../src';

describe('single', () => {
  it('firstSessionTest', async () => {
    const window = await newWindow();
    const browserSession = await newStorage(window);

    browserSession.setItem('aaaa', 'abcdefg');
    expect(browserSession.getItem('aaaa')).toEqual('abcdefg');

    expect(window.localStorage.getItem(`${browserSession.options.namespace}aaaa`)).not.toBeNull();
    expect(window.sessionStorage.getItem(`${browserSession.options.namespace}${BrowserSession.STORAGE_SECRET_KEY_NAME}`)).not.toBeNull();
  });

  it('clearTest', async () => {
    const window = await newWindow();
    const browserSession = await newStorage(window);

    browserSession.setItem('aaaa', 'abcdefg');
    expect(browserSession.getItem('aaaa')).toEqual('abcdefg');

    browserSession.clear();

    expect(browserSession.getKeys().length).toEqual(0);
  });
});
