import * as forge from 'node-forge';

type Partial<T> = {
  [P in keyof T]?: T[P];
};

interface SecretData {
  iv: string;
  key: string;
}

export interface BrowserSessionOptions {
  namespace: string;
  timeout: number;
}

type FetchResponseCallback = (data: SecretData) => void;

const tagLength = 16;

export class BrowserSession {
  public static STORAGE_SECRET_KEY_NAME = '$secret:key';
  public static STORAGE_FETCH_REQUEST_NAME = '$secret:fetch:req';
  public static STORAGE_FETCH_RESPONSE_NAME = '$secret:fetch:res';

  public readonly options: BrowserSessionOptions;
  private _window!: Window;
  private _secretData!: SecretData;

  private _fetchResponseCallback: FetchResponseCallback | null = null;

  constructor();
  constructor(namespace: string);
  constructor(options: Partial<BrowserSessionOptions>);
  constructor(namespaceOrOptions?: Partial<BrowserSessionOptions> | string) {
    this.options = {
      namespace: '',
      timeout: 1000
    };

    if (namespaceOrOptions) {
      if (typeof namespaceOrOptions === 'string') {
        this.options.namespace = namespaceOrOptions;
      } else {
        this.options.namespace = namespaceOrOptions.namespace || '';
        this.options.timeout = this.options.timeout || 1000;
      }
    }
  }

  public start(window: Window): Promise<boolean> {
    let eventListening = false;

    this._window = window;

    if ('addEventListener' in window) {
      window.addEventListener('storage', this.onStorageEvent.bind(this));
      eventListening = true;
    }

    return this.readSecretFromSessionStorage()
        .then((storedInSession) => {
          if (!storedInSession) {
            return this.readSecretFromRemote()
                .then((storedInRemote) => {
                  if (storedInRemote) {
                    this.saveToSessionStorage();
                  }
                  return storedInRemote;
                });
          }
          return storedInSession;
        })
        .then((alreadyExists) => {
          if (!alreadyExists) {
            return this.generateSecretKey()
                .then((secretData) => {
                  this._secretData = secretData;
                  this.saveToSessionStorage();
                });
          }
        })
        .then(() => eventListening);
  }

  public stop() {
    if (this._window && 'removeEventListener' in this._window) {
      this._window.removeEventListener('storage', this.onStorageEvent.bind(this));
    }
  }

  public onStorageEvent(event: StorageEvent): void {
    if (!event.newValue) {
      return ;
    }
    if (event.key === this.makeKey(BrowserSession.STORAGE_FETCH_REQUEST_NAME)) {
      if (this._secretData) {
        this._window.localStorage.setItem(
            this.makeKey(BrowserSession.STORAGE_FETCH_RESPONSE_NAME),
            JSON.stringify(this._secretData)
        );
        this._window.localStorage.removeItem(
            this.makeKey(BrowserSession.STORAGE_FETCH_RESPONSE_NAME)
        );
      }
    } else if (event.key === this.makeKey(BrowserSession.STORAGE_FETCH_RESPONSE_NAME)) {
      if (this._fetchResponseCallback) {
        this._fetchResponseCallback(JSON.parse(event.newValue as string) as SecretData);
      }
    }
  }

  public setItem(key: string, value: string): void {
    const cipher = forge.cipher.createCipher('AES-GCM', this._secretData.key);
    cipher.start({
      iv: this._secretData.iv,
      tagLength: tagLength * 8
    });
    cipher.update(forge.util.createBuffer(value));
    cipher.finish();
    this._window.localStorage.setItem(
        this.makeKey(key),
        forge.util.encode64(cipher.output.getBytes() + cipher.mode.tag.bytes())
    );
  }

  public getItem(key: string): string | null {
    const encryptedB64 = this._window.localStorage.getItem(this.makeKey(key));
    if (!encryptedB64) return null;
    const encrypted = forge.util.decode64(encryptedB64);

    const cipher = forge.cipher.createDecipher('AES-GCM', this._secretData.key);
    cipher.start({
      iv: this._secretData.iv,
      tagLength: tagLength * 8,
      tag: forge.util.createBuffer(encrypted.substring(encrypted.length - tagLength))
    });
    cipher.update(forge.util.createBuffer(encrypted.substring(0, encrypted.length - tagLength)));
    const result = cipher.finish();
    if (!result) {
      // Decryption failed. Maybe it's because the session was expired so the key is different.
      return null;
    }
    return cipher.output.getBytes();
  }

  public removeItem(key: string): void {
    this._window.localStorage.removeItem(this.makeKey(key));
  }

  public getKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < this._window.localStorage.length; i += 1) {
      const keyName = this._window.localStorage.key(i);
      if (keyName && keyName.startsWith(this.options.namespace)) {
        keys.push(keyName.substring(this.options.namespace.length));
      }
    }
    return keys;
  }

  public clear(): void {
    this.getKeys()
        .forEach((key) => {
          this._window.localStorage.removeItem(this.makeKey(key));
        });
  }

  private readSecretFromSessionStorage(): Promise<boolean> {
    try {
      const existsSecretKeyValue = this._window.sessionStorage.getItem(this.makeKey(BrowserSession.STORAGE_SECRET_KEY_NAME));
      if (existsSecretKeyValue) {
        const serialized = JSON.parse(existsSecretKeyValue) as SecretData;
        this._secretData = {
          iv: forge.util.decode64(serialized.iv),
          key: forge.util.decode64(serialized.key)
        }
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  private readSecretFromRemote(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timerId);
        this._fetchResponseCallback = null;
      };
      this._fetchResponseCallback = (data: SecretData) => {
        cleanup();
        this._secretData = data;
        resolve(true);
      };
      const timerId = setTimeout(() => {
        cleanup();
        resolve(false);
      }, this.options.timeout);
      try {
        this._window.localStorage.setItem(
            this.makeKey(BrowserSession.STORAGE_FETCH_REQUEST_NAME),
            'true'
        );
        this._window.localStorage.removeItem(
            this.makeKey(BrowserSession.STORAGE_FETCH_REQUEST_NAME),
        );
      } catch (e) {
        cleanup();
        reject(e);
      }
    });
  }

  private saveToSessionStorage(): void {
    this._window.sessionStorage.setItem(
        this.makeKey(BrowserSession.STORAGE_SECRET_KEY_NAME),
        JSON.stringify({
          iv: forge.util.encode64(this._secretData.iv),
          key: forge.util.encode64(this._secretData.key)
        })
    );
  }

  private generateSecretKey(): Promise<SecretData> {
    return new Promise<SecretData>((resolve, reject) => {
      forge.random.getBytes(64, (err, random) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          iv: random.substring(0, 32),
          key: random.substring(32)
        });
      });
    });
  }

  private makeKey(key: string): string {
    return `${this.options.namespace}${key}`;
  }
}
