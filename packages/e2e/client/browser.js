////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

async function execute({ name, iteration }) {
  await executeIteration({
    name,
    iteration,
    hook: window.UseCases.useCasesMap[name].request,
  });
}

async function executeIteration({ name, iteration, hook }) {
  window.log(`Executing use case "${name}", iteration ${iteration}`);

  //////////////////////////////////////////////////////////////////////////////
  // Customize request for test case & push custom data for assertions
  //////////////////////////////////////////////////////////////////////////////

  let clientData = {};
  let url = '';
  let requestOptions = {};
  if (hook != null) {
    const payload = await hook({ name, iteration });
    clientData = payload.data;
    requestOptions = payload.request;
    const customUrl = requestOptions.url;
    delete requestOptions.url;
    if (customUrl != null) url = customUrl;
  }

  await window.pushClientData({ useCase: name, iteration, data: clientData });

  //////////////////////////////////////////////////////////////////////////////
  // Request
  //////////////////////////////////////////////////////////////////////////////

  const start = performance.now();
  window.log('Targeted URL:', url);
  window.log();
  const response = await fetch(url, requestOptions);
  const time = performance.now() - start;

  //////////////////////////////////////////////////////////////////////////////
  // Push response result
  //////////////////////////////////////////////////////////////////////////////

  const data = {
    body: await response.text(),
    headers: Object.fromEntries(Array.from(response.headers.entries())),
    status: {
      code: response.status,
      message: response.statusText,
    },
    time,
  };

  await window.pushClientResult({ useCase: name, iteration, data });
}
