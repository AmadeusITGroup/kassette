////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export default {
  // Files of a single mock
  /** The name of the file containing the serialized data representing the mock */
  dataFilename: 'data.json',
  inputRequestBaseFilename: 'input-request',
  forwardedRequestBaseFilename: 'forwarded-request',
  checksumFilename: 'checksum',

  /** A static list of headers to ignore when serving the mock */
  ignoredHeaders: new Set([
    'content-length',
    'transfer-encoding',
    'connection',
    'keep-alive',
    ':status',
  ]),

  /** Default values for an empty mock payload */
  emptyPayload: {
    data: {
      headers: {},
      ignoredHeaders: {},
      /** The status code we want the mock to have */
      status: {
        code: 200,
        message: 'OK',
      },
      time: 50,
    },
    /** The content type we want the body file to have */
    bodyContentType: 'application/json',
    body: {},
  },

  /** The set of messages displayed to the end user */
  messages: {
    writingHarFile: 'Writing har file at',
    writingInputRequestData: 'Writing input request data file at',
    writingInputRequestBody: 'Writing input request body file at',
    writingForwardedRequestData: 'Writing forwarded request data file at',
    writingForwardedRequestBody: 'Writing forwarded request body file at',
    writingData: 'Writing data file at',
    writingBody: 'Writing body file at',
    writingChecksumFile: 'Writing checksum file at',

    servingMockDirectly: 'Serving local mock directly',
    inexistentMock: 'Local mock did not exist, creating empty payload',

    alreadyExistingMock: 'Mock exists already, serving it',
    fetchingMock: 'Mock does not exist yet, recording it and serving it',

    requestFailed: 'Request failed',
  },
};
