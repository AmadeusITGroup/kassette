import { ServerResponse } from './';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

describe('server response', () => {
  describe('wrapping', () => {
    it('should provide basic properties', () => {
      const body = Buffer.from('hello');
      const headers = {
        'content-type': 'application/json',
      };
      const statusCode = 200;
      const statusMessage = 'OK';

      const original = {
        headers,
        statusCode,
        statusMessage,
      } as any;
      const response = new ServerResponse(original, body);

      expect(response.headers).toEqual(headers);
      expect(response.body.toString()).toEqual(body.toString());
      expect(response.status).toEqual({
        code: statusCode,
        message: statusMessage,
      });
    });
  });
});
