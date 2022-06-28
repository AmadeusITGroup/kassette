////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

async function execute({ name, ...args }) {
  await executeIteration({
    name,
    hook: window.UseCases.useCasesMap[name].request,
    ...args,
  });
}

async function executeIteration({ name, iteration, hook, ...args }) {
  window.log(`Executing use case "${name}", iteration ${iteration}`);

  //////////////////////////////////////////////////////////////////////////////
  // Customize request for test case & push custom data for assertions
  //////////////////////////////////////////////////////////////////////////////

  let clientData = {};
  let url = '';
  let requestOptions = {};
  if (hook != null) {
    const payload = await hook({ name, iteration, ...args });
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
