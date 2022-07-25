const { Launcher } = require('./backend');

exports.launchBackend = Launcher({
  processName: 'backend',
  hookName: 'serve',
  secure: false,
});

exports.launchAlternativeBackend = Launcher({
  processName: 'alternative-backend',
  hookName: 'alternativeServe',
  secure: true,
});

exports.launchHttp2Backend = Launcher({
  processName: 'http2-backend',
  hookName: 'http2Serve',
  secure: true,
  http2Server: true,
});
