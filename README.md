# browser-session

browser-session is Web Storage with the life cycle of the browser. Browser-session expires when any tab or window using it is all closed. Implemented internally using Local Storage and Session Storage.

# Example

```typescript
const storage = new BrowserSession({
    timeout: 100,
    namespace: 'namespace_name.'
  });
await storage.start(window);

storage.setItem('key', 'value');
storage.getItem('key');
```

# Architecture

- Session Storage stores encryption keys.
- Local Storage stores encrypted values.
- When start a new BrowserSession, it communicates with the currently open page(s) to obtain an encryption key.
- If there is no open page and timeout occurs, a new encryption key is generated and stored in Session Storage.
- The encryption key is kept even if you refresh within the same tab or change pages because session storage is used.

# Contributors

* hayan@yeonyu.dev : He gave the basic idea.
* joseph@jc-lab.net : Implemented security through encryption.

# License

[Apache 2.0 License](./LICENSE)
