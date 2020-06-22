// -------------------------------------------------------------------- internal

const {getCurrentContext} = require('../common');
const {PATHS} = require('../common/paths');



////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

exports.getConfiguration = async function ({context}) {
  const {pushResult} = context;

  return {
    port: 0,
    mode: 'local_or_download',
    delay: 'recorded',
    mocksFolder: PATHS.mocks,

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
