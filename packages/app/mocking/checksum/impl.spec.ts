import { normalizeSpec, processSpec, processList, computeContent } from './impl';

import { IMock } from '../model';



////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

describe('checksum', () => {
  describe('normalize spec', () => {
    it('should wrap booleans', () => {
      expect(normalizeSpec(true)).toEqual({include: true});
      expect(normalizeSpec(false)).toEqual({include: false});
    });

    it('should exclude or use default value if not spec is provided', () => {
      expect(normalizeSpec(undefined)).toEqual({include: false});
      expect(normalizeSpec(undefined, false)).toEqual({include: false});
      expect(normalizeSpec(undefined, true)).toEqual({include: true});
    });

    it('should include by default when a spec is provided', () => {
      expect(normalizeSpec({})).toEqual({include: true});
    });
  });

  describe('process with spec', () => {
    it('should call the processing function if including', async () => {
      const value = '';
      const output = await processSpec(true, true, () => value);
      expect(output).toBe(value);
    });

    it('should return null if not including', async () => {
      const value = '';
      const output = await processSpec(false, false, () => value);
      expect(output).toBe(null);
    });
  });

  describe('process list', () => {
    it('should use filter if provided', async () => {
      const result = await processList({
        filter: object => ({a: object.a}),
        mode: 'whitelist',
        keys: ['b'],
      }, {a: '1', b: '2'}, true);
      expect(JSON.parse(result)).toEqual({a: '1'});
    });

    it('should work in whitelist by default', async () => {
      const result = await processList({
        keys: ['b'],
      }, {a: '1', b: '2'}, true);
      expect(JSON.parse(result)).toEqual({b: '2'});
    });

    it('should keep only whitelisted keys', async () => {
      const result = await processList({
        mode: 'whitelist',
        keys: ['b'],
      }, {a: '1', b: '2'}, true);
      expect(JSON.parse(result)).toEqual({b: '2'});
    });

    it('should exclude blacklisted keys', async () => {
      const result = await processList({
        mode: 'blacklist',
        keys: ['b'],
      }, {a: '1', b: '2'}, true);
      expect(JSON.parse(result)).toEqual({a: '1'});
    });

    it('should support case insensitive mode', async () => {
      const result = await processList({
        mode: 'blacklist',
        keys: ['Content'],
      }, {Lowered: '1', content: '2'}, false);
      expect(JSON.parse(result)).toEqual({lowered: '1'});
    });
  });

  describe('compute content', () => {
    function FakeMock(data: any) {
      const request = Object.assign({
        method: 'GET',
        pathname: '/default',
        body: 'default',
        queryParameters: {default: 'default'},
        headers: {'x-default': 'default'},
      }, data);
      return {request} as IMock;
    }

    function clean(strings: TemplateStringsArray) {
      let lines = strings.join('').split('\n');
      if (lines[0] === '') lines.shift();
      const indentLength = /(\s*).*/.exec(lines[0])![1].length;
      lines = lines.map(line => line.substring(indentLength));
      if (lines[lines.length - 1] === '') lines.pop();
      return lines.join('\n');
    }

    interface StringsMap {
      [key: string]: string;
    }

    const identity = (value: any) => value;

    describe('method', () => {
      const mock = FakeMock({method: 'post'});
      const expectedWhenIncluded = clean`
        method
        post

        pathname

        body

        query

        headers

        custom data

      `;

      const expectedWhenExcluded = clean`
        method

        pathname

        body

        query

        headers

        custom data

      `;

      it('should include method when true', async () => {
        const result = await computeContent(mock, {
          method: true,
          query: false,
          body: false,
        });
        expect(result).toEqual(expectedWhenIncluded);
      });

      it('should exclude method when false', async () => {
        const result = await computeContent(mock, {
          method: false,
          query: false,
          body: false,
        });
        expect(result).toEqual(expectedWhenExcluded);
      });

      it('should exclude method by default', async () => {
        const result = await computeContent(mock, {
          query: false,
          body: false,
        });
        expect(result).toEqual(expectedWhenExcluded);
      });

      it('should include method when {include: true}', async () => {
        const result = await computeContent(mock, {
          method: {include: true},
          query: false,
          body: false,
        });
        expect(result).toEqual(expectedWhenIncluded);
      });

      it('should exclude method when {include: false}', async () => {
        const result = await computeContent(mock, {
          method: {include: false},
          query: false,
          body: false,
        });
        expect(result).toEqual(expectedWhenExcluded);
      });

      it('should force method to lower case', async () => {
        const result = await computeContent(FakeMock({method: 'POST'}), {
          method: true,
          query: false,
          body: false,
        });
        expect(result).toEqual(expectedWhenIncluded);
      });
    });

    describe('pathname', () => {
      const mock = FakeMock({pathname: '/hello/world'});
      const expectedWhenIncluded = clean`
        method

        pathname
        /hello/world

        body

        query

        headers

        custom data

      `;
      const expectedWhenExcluded = clean`
        method

        pathname

        body

        query

        headers

        custom data

      `;

      it('should include pathname when true', async () => {
        const result = await computeContent(mock, {
          pathname: true,
          query: false,
          body: false,
        });
        expect(result).toEqual(expectedWhenIncluded);
      });

      it('should include pathname when {include: true}', async () => {
        const result = await computeContent(mock, {
          pathname: {include: true},
          query: false,
          body: false,
        });
        expect(result).toEqual(expectedWhenIncluded);
      });

      it('should exclude pathname when false', async () => {
        const result = await computeContent(mock, {
          pathname: false,
          query: false,
          body: false,
        });
        expect(result).toEqual(expectedWhenExcluded);
      });

      it('should exclude pathname when {include: false}', async () => {
        const result = await computeContent(mock, {
          pathname: {include: false},
          query: false,
          body: false,
        });
        expect(result).toEqual(expectedWhenExcluded);
      });

      it('should exclude pathname by default', async () => {
        const result = await computeContent(mock, {
          query: false,
          body: false,
        });
        expect(result).toEqual(expectedWhenExcluded);
      });

      it('should support filter', async () => {
        const result = await computeContent(mock, {
          pathname: {
            include: true,
            filter: pathname => [''].concat(pathname.split('/').slice(2)).join('/'),
          },
          query: false,
          body: false,
        });
        expect(result).toEqual(clean`
          method

          pathname
          /world

          body

          query

          headers

          custom data

        `);
      });

      it('should include pathname by default when a filter is used', async () => {
        const result = await computeContent(mock, {
          pathname: {filter: identity},
          query: false,
          body: false,
        });
        expect(result).toEqual(expectedWhenIncluded);
      });
    });

    describe('body', () => {
      const mock = FakeMock({body: Buffer.from('Hello world')});
      const expectedWhenIncluded = clean`
        method

        pathname

        body
        Hello world

        query

        headers

        custom data

      `;
      const expectedWhenExcluded = clean`
        method

        pathname

        body

        query

        headers

        custom data

      `;

      it('should include body when true', async () => {
        const result = await computeContent(mock, {
          body: true,
          query: false,
        });
        expect(result).toEqual(expectedWhenIncluded);
      });

      it('should include body when {include: true}', async () => {
        const result = await computeContent(mock, {
          body: {include: true},
          query: false,
        });
        expect(result).toEqual(expectedWhenIncluded);
      });

      it('should exclude body when false', async () => {
        const result = await computeContent(mock, {
          body: false,
          query: false,
        });
        expect(result).toEqual(expectedWhenExcluded);
      });

      it('should exclude body when {include: false}', async () => {
        const result = await computeContent(mock, {
          body: {include: false},
          query: false,
        });
        expect(result).toEqual(expectedWhenExcluded);
      });

      it('should include body by default', async () => {
        const result = await computeContent(mock, {
          query: false,
        });
        expect(result).toEqual(expectedWhenIncluded);
      });

      it('should support filter', async () => {
        const result = await computeContent(mock, {
          query: false,
          body: {
            include: true,
            filter: body => body.toString().toUpperCase(),
          },
        });
        expect(result).toEqual(clean`
          method

          pathname

          body
          HELLO WORLD

          query

          headers

          custom data

        `);
      });

      it('should include body by default when a filter is used', async () => {
        const result = await computeContent(mock, {
          body: {filter: identity},
          query: false,
        });
        expect(result).toEqual(expectedWhenIncluded);
      });
    });

    describe('query', () => {
      const mock = FakeMock({queryParameters: {
        foo: 'bar',
        baz: 'qux',
      }});

      const expectedWhenIncluded = clean`
        method

        pathname

        body

        query
        {
            "foo": "bar",
            "baz": "qux"
        }

        headers

        custom data

      `;
      const expectedWhenExcluded = clean`
        method

        pathname

        body

        query

        headers

        custom data

      `;

      it('should include query when true', async () => {
        const result = await computeContent(mock, {
          query: true,
          body: false,
        });
        expect(result).toEqual(expectedWhenIncluded);
      });

      it('should include query when {include: true}', async () => {
        const result = await computeContent(mock, {
          query: {include: true},
          body: false,
        });
        expect(result).toEqual(expectedWhenIncluded);
      });

      it('should exclude query when false', async () => {
        const result = await computeContent(mock, {
          query: false,
          body: false,
        });
        expect(result).toEqual(expectedWhenExcluded);
      });

      it('should exclude query when {include: false}', async () => {
        const result = await computeContent(mock, {
          query: {include: false},
          body: false,
        });
        expect(result).toEqual(expectedWhenExcluded);
      });

      it('should include query by default', async () => {
        const result = await computeContent(mock, {
          body: false,
        });
        expect(result).toEqual(expectedWhenIncluded);
      });

      it('should support filter', async () => {
        const result = await computeContent(mock, {
          query: {
            filter(params: StringsMap) {
              const output: StringsMap = {};
              for (const [key, value] of Object.entries(params)) {
                output[key.toUpperCase()] = value;
              }
              return output;
            }
          },
          body: false,
        });

        expect(result).toEqual(clean`
          method

          pathname

          body

          query
          {
              "FOO": "bar",
              "BAZ": "qux"
          }

          headers

          custom data

        `);
      });

      it('should include query by default when an option is used', async () => {
        const result = await computeContent(mock, {
          query: {},
          body: false,
        });
        expect(result).toEqual(expectedWhenIncluded);
      });

      it('should support blacklist', async () => {
        const result = await computeContent(mock, {
          query: {
            mode: 'blacklist',
            keys: ['foo'],
          },
          body: false,
        });
        expect(result).toEqual(clean`
          method

          pathname

          body

          query
          {
              "baz": "qux"
          }

          headers

          custom data

        `);
      });

      it('should support whitelist', async () => {
        const result = await computeContent(mock, {
          query: {
            mode: 'whitelist',
            keys: ['foo'],
          },
          body: false,
        });
        expect(result).toEqual(clean`
          method

          pathname

          body

          query
          {
              "foo": "bar"
          }

          headers

          custom data

        `);
      });

      it('should be in whitelist mode by default', async () => {
        const result = await computeContent(mock, {
          query: {
            keys: ['foo'],
          },
          body: false,
        });
        expect(result).toEqual(clean`
          method

          pathname

          body

          query
          {
              "foo": "bar"
          }

          headers

          custom data

        `);
      });

      it('should be case sensitive by default', async () => {
        const result = await computeContent(mock, {
          query: {
            mode: 'blacklist',
            keys: ['Foo'],
          },
          body: false,
        });
        expect(result).toEqual(clean`
          method

          pathname

          body

          query
          {
              "foo": "bar",
              "baz": "qux"
          }

          headers

          custom data

        `);
      });

      it('should support case insensitive mode', async () => {
        const result = await computeContent(FakeMock({queryParameters: {
          FOO: 'bar',
          Baz: 'qux',
        }}), {
          query: {
            mode: 'blacklist',
            keys: ['Foo'],
            caseSensitive: false,
          },
          body: false,
        });
        expect(result).toEqual(clean`
          method

          pathname

          body

          query
          {
              "baz": "qux"
          }

          headers

          custom data

        `);
      });
    });

    describe('headers', () => {
      const mock = FakeMock({headers: {
        'Content-Type': 'application/json',
        'Content-Length': '56',
      }});

      const expectedWhenIncluded = clean`
        method

        pathname

        body

        query

        headers
        {
            "content-type": "application/json",
            "content-length": "56"
        }

        custom data

      `;
      const expectedWhenExcluded = clean`
        method

        pathname

        body

        query

        headers

        custom data

      `;

      it('should include headers when true', async () => {
        const result = await computeContent(mock, {
          headers: true,
          body: false,
          query: false,
        });
        expect(result).toEqual(expectedWhenIncluded);
      });

      it('should include headers when {include: true}', async () => {
        const result = await computeContent(mock, {
          headers: {include: true},
          body: false,
          query: false,
        });
        expect(result).toEqual(expectedWhenIncluded);
      });

      it('should exclude headers when false', async () => {
        const result = await computeContent(mock, {
          headers: false,
          body: false,
          query: false,
        });
        expect(result).toEqual(expectedWhenExcluded);
      });

      it('should exclude headers when {include: false}', async () => {
        const result = await computeContent(mock, {
          headers: {include: false},
          body: false,
          query: false,
        });
        expect(result).toEqual(expectedWhenExcluded);
      });

      it('should not include headers by default', async () => {
        const result = await computeContent(mock, {
          body: false,
          query: false,
        });
        expect(result).toEqual(expectedWhenExcluded);
      });

      it('should support filter', async () => {
        const result = await computeContent(mock, {
          headers: {
            filter(params: StringsMap) {
              const output: StringsMap = {};
              for (const [key, value] of Object.entries(params)) {
                output[key.toUpperCase()] = value;
              }
              return output;
            }
          },
          body: false,
          query: false,
        });

        expect(result).toEqual(clean`
          method

          pathname

          body

          query

          headers
          {
              "CONTENT-TYPE": "application/json",
              "CONTENT-LENGTH": "56"
          }

          custom data

        `);
      });

      it('should include headers by default when an option is used', async () => {
        const result = await computeContent(mock, {
          headers: {},
          body: false,
          query: false,
        });
        expect(result).toEqual(expectedWhenIncluded);
      });

      it('should support blacklist', async () => {
        const result = await computeContent(mock, {
          headers: {
            mode: 'blacklist',
            keys: ['Content-Length'],
          },
          body: false,
          query: false,
        });
        expect(result).toEqual(clean`
          method

          pathname

          body

          query

          headers
          {
              "content-type": "application/json"
          }

          custom data

        `);
      });

      it('should support whitelist', async () => {
        const result = await computeContent(mock, {
          headers: {
            mode: 'whitelist',
            keys: ['Content-Type'],
          },
          body: false,
          query: false,
        });
        expect(result).toEqual(clean`
          method

          pathname

          body

          query

          headers
          {
              "content-type": "application/json"
          }

          custom data

        `);
      });

      it('should be in whitelist mode by default', async () => {
        const result = await computeContent(mock, {
          headers: {
            keys: ['Content-Type'],
          },
          body: false,
          query: false,
        });
        expect(result).toEqual(clean`
          method

          pathname

          body

          query

          headers
          {
              "content-type": "application/json"
          }

          custom data

        `);
      });

      it('should be case insensitive by default', async () => {
        const result = await computeContent(mock, {
          headers: {
            mode: 'blacklist',
            keys: ['content-length'],
          },
          body: false,
          query: false,
        });
        expect(result).toEqual(clean`
          method

          pathname

          body

          query

          headers
          {
              "content-type": "application/json"
          }

          custom data

        `);
      });

      it('should support case sensitive mode', async () => {
        const result = await computeContent(mock, {
          headers: {
            mode: 'blacklist',
            keys: ['content-length'],
            caseSensitive: true,
          },
          body: false,
          query: false,
        });
        expect(result).toEqual(clean`
          method

          pathname

          body

          query

          headers
          {
              "Content-Type": "application/json",
              "Content-Length": "56"
          }

          custom data

        `);
      });
    });

    describe('customData', () => {
      it('should include any custom data', async () => {
        const result = await computeContent(FakeMock({}), {
          body: false,
          query: false,
          customData: {
            custom: 'data'
          },
        });
        expect(result).toEqual(clean`
          method

          pathname

          body

          query

          headers

          custom data
          {
              "custom": "data"
          }

        `);
      });
    });
  });
});
