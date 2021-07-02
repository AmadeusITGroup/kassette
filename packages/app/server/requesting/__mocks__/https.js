const { FakeRequester, FakeResponse } = require('./_common');

exports.request = function (
  {
    method,
    headers,

    hostname,
    port,
    path,
  },
  callback,
) {
  return FakeRequester(callback, ({ body }) =>
    FakeResponse({
      headers: { 'content-type': 'application/json' },
      code: 200,
      message: 'OK',
      body: JSON.stringify({
        headers,
        method,
        hostname,
        port,
        path,
        body,
        secure: true,
      }),
    }),
  );
};
