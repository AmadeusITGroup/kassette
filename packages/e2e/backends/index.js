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
