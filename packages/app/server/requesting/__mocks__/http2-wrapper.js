const { FakeRequester, FakeResponse } = require('./_common');

exports.auto = async function (url, { method, headers }) {
  return FakeRequester(({ body }) =>
    FakeResponse({
      headers: { 'content-type': 'application/json' },
      code: 200,
      message: 'OK',
      body: JSON.stringify({
        headers,
        method,
        url,
        body,
      }),
    }),
  );
};

exports.globalAgent = {};
