// ------------------------------------------------------------------------- std

const nodePath = require('path');

////////////////////////////////////////////////////////////////////////////////
// Functions
////////////////////////////////////////////////////////////////////////////////

function localPath(...parts) {
  return nodePath.join(__dirname, '..', ...parts);
}

////////////////////////////////////////////////////////////////////////////////
// Data
////////////////////////////////////////////////////////////////////////////////

const projectRoot = localPath('..', '..');
const workspace = localPath('__ws__');
const PATHS = {
  projectRoot,
  binaryFile: nodePath.join(projectRoot, 'bin/index.js'),

  workspace,
  outputs: nodePath.join(workspace, 'outputs'),
  mocks: nodePath.join(workspace, 'mocks'),
  resultsFolder: nodePath.join(workspace, 'results'),
};
exports.PATHS = PATHS;
