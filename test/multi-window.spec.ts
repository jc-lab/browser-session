import {
  BrowserSession
} from '../src';
import {
  newSessionStorageWindow
} from './web-storage-mock';

function newSubWindow(): Promise<Window> {
  const frame = window.document.createElement('iframe');
  return new Promise<Window>((resolve, reject) => {
    frame.onload = () => {
      resolve(frame.contentWindow as any);
    };
    frame.onerror = (err) => {
      reject(err);
    };
    frame.src = 'about:blank';
    window.document.body.appendChild(frame);
  });
}

function newStorage(explicitWindow?: Window): Promise<BrowserSession> {
  const storage = new BrowserSession({
    timeout: 100
  });
  return Promise.resolve()
      .then(async () => {
        if (explicitWindow) {
          return storage.start(explicitWindow);
        } else {
          return storage.start(newSessionStorageWindow(await newSubWindow()));
        }
      })
      .then(() => storage);
}

describe('multiWindow', () => {
  it('sessionPropagationTest', async () => {
    const sessions = [
      await newStorage(),
      await newStorage()
    ];

    sessions[0].setItem('bbbb', 'abcdefg');
    expect(sessions[1].getItem('bbbb')).toEqual('abcdefg');
  });


  it('autoDestroyTest', async () => {
    const windows: Window[] = [
      await newSubWindow() as any,
      await newSubWindow() as any
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

    const afterSession = await newStorage(await newSubWindow());
    expect(afterSession.getItem('bbbb')).toBeNull();
  });
});
