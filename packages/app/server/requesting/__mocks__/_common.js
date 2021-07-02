function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

exports.FakeResponse = function ({ headers, code, message, body }) {
  let onEnd = null;
  let dataAllPushed = false;

  return {
    headers,
    statusCode: code,
    statusMessage: message,
    on: async (type, callback) => {
      if (type === 'data') {
        await nextTick();
        callback(Buffer.from(body));
        dataAllPushed = true;
        if (onEnd != null) {
          onEnd();
        }
      } else if (type === 'end') {
        await nextTick();
        if (dataAllPushed) {
          callback();
        } else {
          onEnd = callback;
        }
      }
    },
  };
};

exports.FakeRequester = function (callback, buildResponse) {
  return {
    on: function (event, handler) {
      return this;
    },
    end: async (body) => {
      await nextTick();
      callback(buildResponse({ body }));
    },
  };
};
