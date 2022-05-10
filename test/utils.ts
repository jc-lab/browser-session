import {
  JSDOM
} from 'jsdom';
import {BrowserSession} from '../src';
import {newSessionStorageWindow} from './web-storage-mock';

export function newWindow(): Window {
  return new JSDOM('', {
    url: 'http://localhost'
  }).window as any;
}

export function newSubWindow(rootWindow: Window): Promise<Window> {
  const frame = rootWindow.document.createElement('iframe');
  return new Promise<Window>((resolve, reject) => {
    frame.onload = () => {
      resolve(frame.contentWindow as any);
    };
    frame.onerror = (err) => {
      reject(err);
    };
    frame.src = 'about:blank';
    rootWindow.document.body.appendChild(frame);
  });
}

export function newStorage(window: Window): Promise<BrowserSession> {
  const storage = new BrowserSession({
    timeout: 100,
    namespace: 'test.'
  });
  return Promise.resolve()
      .then(() => {
        return storage.start(window);
      })
      .then(() => storage);
}
