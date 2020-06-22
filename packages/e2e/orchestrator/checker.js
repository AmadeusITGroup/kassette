// ------------------------------------------------------------------------- 3rd

const {assert, expect} = require('chai');

// -------------------------------------------------------------------- internal

const {useCases} = require('../use-cases');



////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

async function defineMochaTests(getData) {
  useCases.forEach(useCase => {
    const description = useCase.description != null ? useCase.description : useCase.name;
    describe(description, () => {
      useCase.defineAssertions({
        useCase,
        describe, it,
        assert, expect,
        getData: (iteration) => {
          const {results, console} = getData();
          return {
            iteration,
            results, console,
            data: results[useCase.name].iterations[iteration],
          };
        },
      });
    });
  });
}
exports.defineMochaTests = defineMochaTests;
