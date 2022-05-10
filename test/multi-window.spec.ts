import {
  newStorage,
  newSubWindow,
  newWindow
} from './utils';

describe('multiWindow', () => {
  it('sessionPropagationTest', async () => {
    const rootWindow = newWindow();

    const sessions = [
      await newStorage(await newSubWindow(rootWindow)),
      await newStorage(await newSubWindow(rootWindow))
    ];

    sessions[0].setItem('bbbb', 'abcdefg');
    expect(sessions[1].getItem('bbbb')).toEqual('abcdefg');
  });


  it('autoDestroyTest', async () => {
    const rootWindow = newWindow();

    const windows: Window[] = [
      await newSubWindow(rootWindow) as any,
      await newSubWindow(rootWindow) as any
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
