// -------------------------------------------------------------------- internal

const {getCurrentContext} = require('../common');
const {PATHS} = require('../common/paths');



////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * @return { import("../../..").ConfigurationSpec }
 */
exports.getConfiguration = async function ({context}) {
  const {pushResult} = context;

  return {
    port: 0,
    mode: 'local_or_download',
    proxyConnectMode: 'close',
    delay: 'recorded',
    mocksFolder: PATHS.mocks,

    onProxyConnect: async (request) => {
      const {useCase, name, iteration} = getCurrentContext();
      if (useCase.onProxyConnect != null) {
        await useCase.onProxyConnect(request, {context, useCase, name, iteration})
      }
    },

    hook: async (api) => {
      const {mock} = api;

      const {useCase, name, iteration} = getCurrentContext();
      if (useCase.proxy != null) {
        mock.setLocalPath(name);
        const result = await useCase.proxy(api, {context, useCase, name, iteration});
        await pushResult({useCase: name, iteration, data: result});
      }
    },
  };
}
