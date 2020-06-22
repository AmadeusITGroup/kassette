// ------------------------------------------------------------------------- std

const nodePath = require('path');

// -------------------------------------------------------------------- internal

const {PATHS} = require('../common/paths');
const {launchServer} = require('../common/launcher');



////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

function localPath(...args) {
  return nodePath.join(__dirname, ...args);
}
function buildRemoteURL(port, secure = false) {
  return `http${secure ? 's' : ''}://127.0.0.1:${port}/`;
}



////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

async function launch({
  backendPort,
  alternativeBackendPort,
  pushResult,
}) {
  return launchServer({
    name: 'proxy',
    run: async function ({onStart, onExit, console}) {
      return require(PATHS.projectRoot).run({
        configurationPath: localPath('conf.js'),
        fileConfigurationContext: {
          pushResult,
          alternativeRemoteURL: buildRemoteURL(alternativeBackendPort, true),
        },
        apiConfiguration: {
          onListen: onStart,
          onExit,
          console,
          remoteURL: buildRemoteURL(backendPort),
        },
      });
    },
  });
}
exports.launch = launch;
