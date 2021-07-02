import { Duplex } from 'stream';
import { readAll } from './stream';

describe('stream', () => {
  describe('fetchContent', () => {
    it('should handle stream-like objects', () => {
      class MyStream {
        private _onData: (chunk: Buffer) => {};
        private _onEnd: () => {};

        on(eventName: string, callback: any) {
          if (eventName === 'data') {
            this._onData = callback;
          } else if (eventName === 'end') {
            this._onEnd = callback;
          }
        }

        private _pushData(chunk: string) {
          this._onData(Buffer.from(chunk));
        }
        private _end() {
          this._onEnd();
        }

        start() {
          this._pushData('hel');
          this._pushData('lo');
          this._end();
        }
      }
      const stream = new MyStream();

      const promise = readAll(stream).then((result) => {
        expect(result.toString()).toEqual('hello');
      });

      stream.start();
      return promise;
    });

    it('should handle Node.js streams', () => {
      let content = '';
      const stream = new Duplex({
        read(size: number) {
          this.push(content.slice(0, size));
          content = content.slice(size);
          if (content === '') {
            this.push(null);
          }
        },

        write(chunk: any, _encoding: string, callback: Function) {
          content += chunk;
          callback();
        },
      });

      const promise = readAll(stream).then((result) => {
        expect(result.toString()).toEqual('hello');
      });

      stream.write('hel');
      stream.end('lo');
      return promise;
    });
  });
});
