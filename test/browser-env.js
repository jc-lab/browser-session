const jestEnvironmentJsdom = require('jest-environment-jsdom');

const JSDOMEnvironment = ('default' in jestEnvironmentJsdom) ? jestEnvironmentJsdom.default : jestEnvironmentJsdom;

class CustomTestEnvironment extends JSDOMEnvironment {
  setup() {
    return super.setup()
      .then(() => {
        if (typeof this.global.TextEncoder === 'undefined') {
          const { TextEncoder, TextDecoder } = require('util');
          Object.assign(this.global, {
            TextEncoder: TextEncoder,
            TextDecoder: TextDecoder,
            Uint8Array: Uint8Array
          });
        }
      });
  }
}

module.exports = CustomTestEnvironment;
