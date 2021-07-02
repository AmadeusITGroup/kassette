// ------------------------------------------------------------------------- std

const { promises: fs } = require('fs');
const nodePath = require('path');

// -------------------------------------------------------------------- internal

const { PATHS } = require('./paths');

////////////////////////////////////////////////////////////////////////////////
// Local library
////////////////////////////////////////////////////////////////////////////////

function getDefault(container, property, defaultValue) {
  let value = container[property];
  if (value == null) {
    value = defaultValue;
    container[property] = value;
  }
  return value;
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

class ResultsHandler {
  constructor() {
    this.results = {};
    this._resultsPath = nodePath.join(PATHS.resultsFolder, 'orchestrator.json');
  }

  async initialize() {
    return this._write();
  }
  async finalize() {
    return this._write();
  }
  async getResults() {
    return this.results;
  }

  pusher(processName) {
    return async (payload) => {
      let { useCase, iteration, data } = payload;
      if (data == null) data = {};
      this._getIteration(useCase, iteration)[processName] = data;
      await this._write();
    };
  }

  async _write() {
    return fs.writeFile(this._resultsPath, JSON.stringify(this.results, null, 4));
  }

  _getUseCase(name) {
    return getDefault(this.results, name, { useCase: name, iterations: [] });
  }

  _getIteration(useCaseName, index) {
    return getDefault(this._getUseCase(useCaseName).iterations, index, {});
  }
}
exports.ResultsHandler = ResultsHandler;
