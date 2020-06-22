////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

let context;

function setCurrentContext(useCase, iteration) {
  context = {useCase, iteration, name: useCase.name};
}
exports.setCurrentContext = setCurrentContext;

function getCurrentContext() {
  return context;
}
exports.getCurrentContext = getCurrentContext;
