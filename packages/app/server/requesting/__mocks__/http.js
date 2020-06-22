const {FakeRequester, FakeResponse} = require('./_common');

exports.request = function(url, {method, headers}, callback) {
  return FakeRequester(callback, ({body}) => FakeResponse({
    headers: {'content-type': 'application/json'},
    code: 200,
    message: 'OK',
    body: JSON.stringify({
      headers,
      method,
      url,
      body,
      secure: false,
    }),
  }));
}
