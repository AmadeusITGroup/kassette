const { run } = require('./orchestrator');
const { defineMochaTests } = require('./orchestrator/checker');

describe('kassette', () => {
  let result;
  before(async function () {
    this.timeout(0);
    result = await run();
  });

  defineMochaTests(() => result.testPayload);

  after(async () => result.finalize());
});
