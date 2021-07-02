import * as nodePath from 'path';

import { load } from './module';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

interface Interface {
  getValue: () => number;
  increment: () => number;
}

describe('module', () => {
  describe('load', () => {
    const path = nodePath.join(__dirname, '__test__', 'loadable.js');

    // 2019-08-27T15:58:51+02:00
    // can't test this, since `rechoir` 3rd party library used under the hood
    // uses `require.extensions` and Jest alters that in a bad way for us.
    // Workarounds probably possible, but not handy to put in place.
    // I'd drop Jest rather than introduce workarounds.
    it.skip('should load module and reload on demand', async () => {
      async function run(reload = false, offset = 0) {
        const { loaded, module } = await load<Interface>({ path, reload });
        expect(loaded).toBeTruthy();
        expect(module).not.toBeNull();
        expect(module!.getValue()).toBe(0 + offset);
        module!.increment();
        expect(module!.getValue()).toBe(1 + offset);
      }

      await run();
      await run(false, 1);
      await run(true);
    });
  });
});
