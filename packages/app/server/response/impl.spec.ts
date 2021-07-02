import { Response } from './impl';

describe('response', () => {
  describe('headers', () => {
    it('should merge headers', () => {
      const response = new Response(null as any);

      expect(response.headers).toEqual({});

      response.setHeaders({ first: '1st' });
      expect(response.headers).toEqual({ first: '1st' });

      response.setHeaders({ second: '2nd' });
      expect(response.headers).toEqual({ first: '1st', second: '2nd' });

      response.setHeaders({ first: null, second: '3rd' });
      expect(response.headers).toEqual({ first: null, second: '3rd' });
    });
  });

  describe('body', () => {
    it('should store body as is', () => {
      const response = new Response(null as any);
      let body;

      expect(response.body).toBeUndefined();

      body = response.body = 'hello';
      expect(response.body).toBe(body);
      expect(response.body).toEqual('hello');

      body = response.body = Buffer.from('world');
      expect(response.body).toBe(body);
      expect(response.body.toString()).toEqual('world');

      body = response.body = {};
      expect(response.body).toBe(body);
      expect(response.body).toEqual({});

      body = response.body = null;
      expect(response.body).toBe(body);
      expect(response.body).toBeNull();

      response.setData((body = 'hello'));
      expect(response.body).toBe(body);
      expect(response.body).toEqual('hello');

      response.setData((body = Buffer.from('world')));
      expect(response.body).toBe(body);
      expect(response.body.toString()).toEqual('world');

      response.setData((body = {}));
      expect(response.body).toBe(body);
      expect(response.body).toEqual({});
    });

    it('should set json implicitly', () => {
      const response = new Response(null as any);

      expect(response.json).toBe(false);

      response.body = 'hello';
      expect(response.json).toBe(false);

      response.body = Buffer.from('world');
      expect(response.json).toBe(false);

      response.body = {};
      expect(response.json).toBe(true);

      response.body = null;
      expect(response.json).toBe(false);

      response.setData('hello');
      expect(response.json).toBe(true);
      response.json = false;
      expect(response.json).toBe(false);

      response.setData(Buffer.from('world'));
      expect(response.json).toBe(true);
      response.json = false;
      expect(response.json).toBe(false);

      response.setData({});
      expect(response.json).toBe(true);
      response.json = false;
      expect(response.json).toBe(false);
    });
  });

  describe('send', () => {
    function ResponseMock() {
      const output = {
        headers: {},
      } as any;

      const response = new Response({
        writeHead: (code: number, message: string) => {
          output.code = code;
          output.message = message;
        },

        setHeader: (header: string, value: any) => {
          output.headers[header] = value;
        },

        end: (_body: any, callback: Function) => {
          output.body = _body.toString();
          callback();
        },
      } as any);

      return { output, response };
    }

    it('should send JSON properly', async () => {
      const { output, response } = ResponseMock();

      const body = { key: 'value' };
      response.body = body;
      await response.send();
      expect(JSON.parse(output.body)).toEqual(body);
      expect(output.code).toBe(200);
      expect(output.message).toBeUndefined();
      expect(output.headers).toEqual({
        'content-type': 'application/json',
      });
    });

    it('should send buffers', async () => {
      const { output, response } = ResponseMock();

      const body = 'Hello';
      response.body = Buffer.from(body);
      await response.send();
      expect(output.body).toBe(body);
      expect(output.code).toBe(200);
      expect(output.message).toBeUndefined();
      expect(output.headers).toEqual({});
    });

    it('should send empty body by default', async () => {
      const { output, response } = ResponseMock();

      await response.send();
      expect(output.body).toBe('');
      expect(output.code).toBe(200);
      expect(output.message).toBeUndefined();
      expect(output.headers).toEqual({});
    });

    it('should send custom status', async () => {
      const { output, response } = ResponseMock();

      const code = 404;
      const message = 'custom';
      response.status = { code, message };
      await response.send();

      expect(output.body).toBe('');
      expect(output.code).toBe(code);
      expect(output.message).toBe(message);
      expect(output.headers).toEqual({});
    });

    it('should set default status code', async () => {
      const { output, response } = ResponseMock();

      response.status = {};
      await response.send();

      expect(output.body).toBe('');
      expect(output.code).toBe(200);
      expect(output.message).toBeUndefined();
      expect(output.headers).toEqual({});
    });
  });
});
