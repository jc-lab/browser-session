export class WebStorageMock implements Storage {
  private store: Record<string, string> = {};
  [name: string]: any;

  get length(): number {
    return Object.keys(this.store).length;
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = value.toString();
  }

  removeItem(key: string) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] || null;
  }
}

export function newSessionStorageWindow(window: Window): Window {
  const sessionStorage = new WebStorageMock();
  return new Proxy<Window>(window as any, {
    get: function (target, name: any) {
      if (name === 'sessionStorage') {
        return sessionStorage;
      }
      return target[name];
    }
  });
}
