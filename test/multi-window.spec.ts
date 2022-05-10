import {
  newStorage,
  newSubWindow,
  newWindow
} from './utils';
import {BrowserSession} from '../src';
import {newSessionStorageWindow} from './web-storage-mock';

describe('multiWindow', () => {
  it('sessionPropagationTest', async () => {
    const rootWindow = newWindow();

    const windows = [
      newSessionStorageWindow(await newSubWindow(rootWindow) as any),
      newSessionStorageWindow(await newSubWindow(rootWindow) as any)
    ];
    const sessions = [
      await newStorage(windows[0]),
      await newStorage(windows[1])
    ];

    sessions[0].setItem('bbbb', 'abcdefg');

    expect(sessions[1].getItem('bbbb')).toEqual('abcdefg');

    expect(windows[0].localStorage.getItem(`${sessions[0].options.namespace}bbbb`)).not.toBeNull();
    expect(windows[1].localStorage.getItem(`${sessions[0].options.namespace}bbbb`)).not.toBeNull();
    expect(windows[0].sessionStorage.getItem(`${sessions[0].options.namespace}${BrowserSession.STORAGE_SECRET_KEY_NAME}`)).not.toBeNull();
    expect(windows[1].sessionStorage.getItem(`${sessions[0].options.namespace}${BrowserSession.STORAGE_SECRET_KEY_NAME}`)).not.toBeNull();
    expect(windows[0].sessionStorage.getItem(`${sessions[0].options.namespace}${BrowserSession.STORAGE_SECRET_KEY_NAME}`))
        .toEqual(windows[1].sessionStorage.getItem(`${sessions[0].options.namespace}${BrowserSession.STORAGE_SECRET_KEY_NAME}`));
  });


  it('autoDestroyTest', async () => {
    const rootWindow = newWindow();

    const windows: Window[] = [
      newSessionStorageWindow(await newSubWindow(rootWindow) as any),
      newSessionStorageWindow(await newSubWindow(rootWindow) as any)
    ];
    const sessions = [
      await newStorage(windows[0]),
      await newStorage(windows[1])
    ];

    sessions[0].setItem('bbbb', 'abcdefg');
    expect(sessions[1].getItem('bbbb')).toEqual('abcdefg');

    sessions[0].stop();
    sessions[1].stop();
    windows[0].close();
    windows[1].close();

    const afterSession = await newStorage(await newSubWindow(rootWindow));
    expect(afterSession.getItem('bbbb')).toBeNull();
  });
});
