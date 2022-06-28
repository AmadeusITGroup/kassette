// cf http://www.softwareishard.com/blog/har-12-spec/

export interface HarFormat {
  log: HarFormatLog;
}

export interface HarFormatLog {
  version?: string;
  creator: HarFormatApp;
  browser?: HarFormatApp;
  pages?: any[];
  entries: HarFormatEntry[];
  comment?: string;
}

export interface HarFormatApp {
  name: string;
  version?: string;
  comment?: string;
}

/**
 * Detailed information about a request and its response, as stored in a har file.
 *
 * @public
 */
export interface HarFormatEntry {
  /**
   * Content used to create a checksum
   *
   * @remarks
   *
   * kassette only includes this field if {@link IMock.saveChecksumContent | saveChecksumContent} is true and
   * if the {@link IMock.checksum | checksum} method was called.
   */
  _kassetteChecksumContent?: string;

  /**
   * Key used by kassette to select the correct mock to replay.
   *
   * @remarks
   *
   * This field contains the value passed to {@link IMock.setMockHarKey} when used with the default
   * {@link ConfigurationSpec.mocksHarKeyManager | mocksHarKeyManager}.
   */
  _kassetteMockKey?: string;

  /**
   * Detailed information about the request forwarded to the remote server.
   *
   * @remarks
   *
   * kassette only includes this field if {@link IMock.saveForwardedRequestData | saveInputRequestData} is true.
   */
  _kassetteForwardedRequest?: HarFormatRequest;

  /**
   * Reference to the parent page. This is not implemented in kassette.
   */
  pageref?: string;

  /**
   * Date and time of the request start, as a string in ISO format (YYYY-MM-DDThh:mm:ss.sTZD).
   */
  startedDateTime?: string;

  /**
   * Total time of the request, in milliseconds. This is the sum of all timings in the {@link HarFormatEntry.timings | timings object}.
   */
  time?: number;

  /**
   * Detailed information about the input request.
   *
   * @remarks
   *
   * kassette only includes this field if {@link IMock.saveInputRequestData | saveInputRequestData} is true.
   */
  request?: HarFormatRequest;

  /**
   * Detailed information about the response.
   */
  response?: HarFormatResponse;

  /**
   * Information about the cache. This is not implemented in kassette.
   */
  cache?: any; // not implemented

  /**
   * Detailed timing information about request/response round trip.
   *
   * @remarks
   *
   * kassette only includes this field if {@link IMock.saveDetailedTimings | saveDetailedTimings} is true.
   */
  timings?: HarFormatTimings;

  /**
   * Server IP address. This is not implemented in kassette.
   */
  serverIPAddress?: string; // not implemented

  /**
   * Unique ID of the TCP/IP connection. This is not implemented in kassette.
   */
  connection?: string; // not implemented

  /**
   * Any comment as a string. This is not used by kassette.
   */
  comment?: string;
}

/**
 * Detailed information about a request, as stored in a har file.
 *
 * @public
 */
export interface HarFormatRequest {
  /**
   * Request method, such as "GET" or "POST".
   */
  method?: string;

  /**
   * Request URL.
   */
  url?: string;

  /**
   * Request HTTP version, such as "HTTP/1.1".
   */
  httpVersion?: string;

  /**
   * Information about cookies. This is not implemented in kassette.
   */
  cookies?: any[]; // not implemented

  /**
   * List of request headers.
   */
  headers?: HarFormatNameValuePair[];

  /**
   * List of query parameters.
   */
  queryString?: HarFormatNameValuePair[];

  /**
   * Information about the request body.
   *
   * @remarks
   *
   * kassette only includes this field if {@link IMock.saveInputRequestBody | saveInputRequestBody} is true
   * (or, for the {@link HarFormatEntry._kassetteForwardedRequest | _kassetteForwardedRequest}.postData field,
   * if {@link IMock.saveForwardedRequestBody | saveForwardedRequestBody} is true).
   */
  postData?: HarFormatPostData;

  /**
   * Total number of bytes from the start of the HTTP request message until (and including) the double CRLF before the body,
   * or -1 if it is unknown. kassette always sets -1 for this field.
   */
  headersSize?: number;

  /**
   * Size of the request body in bytes or -1 if it is unknown.
   */
  bodySize?: number;

  /**
   * Any comment as a string. This is not used by kassette.
   */
  comment?: string;
}

/**
 * Detailed information about a response, as stored in a har file.
 *
 * @public
 */
export interface HarFormatResponse {
  /**
   * Response status.
   */
  status?: number;

  /**
   * Response status text.
   */
  statusText?: string;

  /**
   * Response HTTP version, such as "HTTP/1.1".
   */
  httpVersion?: string;

  /**
   * Information about cookies. This is not implemented in kassette.
   */
  cookies?: any[]; // not implemented

  /**
   * List of response headers.
   */
  headers?: HarFormatNameValuePair[];

  /**
   * Information about the response body.
   */
  content?: HarFormatContent;

  /**
   * Content of the `Location` response header if present.
   */
  redirectURL?: string;

  /**
   * Total number of bytes from the start of the HTTP response message until (and including) the double CRLF before the body,
   * or -1 if it is unknown. kassette always sets -1 for this field.
   */
  headersSize?: number;

  /**
   * Size of the response body in bytes, or -1 if it is unknown.
   */
  bodySize?: number;

  /**
   * Any comment as a string. This is not used by kassette.
   */
  comment?: string;
}

/**
 * Details about the time spent for each phase of a request-response round trip. All times are specified in milliseconds.
 *
 * @public
 */
export interface RequestTimings {
  /**
   * Time spent in a queue waiting for a network connection.
   * Can be -1 if the timing does not apply to the current request.
   */
  blocked?: number;

  /**
   * The time required to resolve a host name.
   * Can be -1 if the timing does not apply to the current request.
   */
  dns?: number;

  /**
   * Time required to create TCP connection.
   * Can be -1 if the timing does not apply to the current request.
   */
  connect?: number;

  /**
   * Time required to send HTTP request to the server.
   */
  send?: number;

  /**
   * Time waiting for a response from the server.
   */
  wait?: number;

  /**
   * Time required to read entire response from the server.
   */
  receive?: number;

  /**
   * Time required for SSL/TLS negotiation.
   * This time is also included in the {@link RequestTimings.connect|RequestTimings.connect} field.
   * Can be -1 if the timing does not apply to the current request.
   */
  ssl?: number;
}

/**
 * Details about the time spent for each phase of a request-response round trip, as stored in a har file.
 *
 * @public
 */
export interface HarFormatTimings extends RequestTimings {
  /**
   * Any comment as a string. This is not used by kassette.
   */
  comment?: string;
}

/**
 * Information about a request body, as stored in a har file.
 *
 * @public
 */
export interface HarFormatPostData {
  /**
   * Value of the `Content-Type` request header, if present.
   */
  mimeType?: string;

  /**
   * List of posted parameters. This is not implemented in kassette.
   *
   * @remarks
   *
   * kassette always fills the {@link HarFormatPostData.text | text field} and never uses the params field.
   */
  params?: any[]; // not implemented

  /**
   * Posted data, as a (binary) string.
   */
  text?: string;

  /**
   * Any comment as a string. This is not used by kassette.
   */
  comment?: string;
}

/**
 * Information about the response body, as stored in a har file.
 *
 * @public
 */
export interface HarFormatContent {
  /**
   * Size of the content in bytes.
   */
  size?: number;

  /**
   * Number of bytes saved by compression. This is not implemented by kassette.
   */
  compression?: number;

  /**
   * Value of the `Content-Type` response header.
   */
  mimeType?: string;

  /**
   * Response body.
   *
   * @remarks
   *
   * The response body can be encoded in base64 if this is specified in the {@link HarFormatContent.encoding | encoding} field.
   */
  text?: string;

  /**
   * Encoding used for the {@link HarFormatContent.text | text} field, such as "base64".
   */
  encoding?: string;

  /**
   * Any comment as a string. This is not used by kassette.
   */
  comment?: string;
}

/**
 * Information about a header or a query parameter, as stored in a har file.
 *
 * @public
 */
export interface HarFormatNameValuePair {
  /**
   * Name of the header or query parameter.
   */
  name: string;

  /**
   * Value of the header or the query parameter.
   */
  value: string;

  /**
   * Any comment as a string. This is not used by kassette.
   */
  comment?: string;
}
