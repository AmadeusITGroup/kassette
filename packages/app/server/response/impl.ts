// ------------------------------------------------------------------------- std

import { ServerResponse } from 'http';

// ---------------------------------------------------------------------- common

import { stringifyPretty, JSONData } from '../../../lib/json';
import { UserProperty } from '../../../lib/user-property';
import { logError } from '../../logger';

// -------------------------------------------------------------------- internal

import { Headers } from '../model';

import { IResponse, ResponseStatus, Body } from './model';

// ------------------------------------------------------------------------ conf

import CONF from './conf';

////////////////////////////////////////////////////////////////////////////////
// Model: Response
////////////////////////////////////////////////////////////////////////////////

/**
 * Implementation of the wrapper around a response.
 *
 * @param original The original response object (that can be retrieved through `original`)
 */
export class Response implements IResponse {
  private _body: Body | null;
  private _json = new UserProperty({
    getDefaultInput: () => {
      const { body } = this;
      return body != null && typeof body !== 'string' && !Buffer.isBuffer(body);
    },
  });
  public status: ResponseStatus = null;

  private _headers: Headers = {};

  constructor(public readonly original: ServerResponse) {}

  set body(value: Body | null) {
    this._body = value;
    this._json.resetInputCache();
  }
  get body(): Body | null {
    return this._body;
  }

  get json(): boolean {
    return this._json.output;
  }
  set json(value: boolean) {
    this._json.set(value);
  }

  public setData(data: JSONData) {
    this.json = true;
    this.body = data;
  }

  get headers(): Readonly<Headers> {
    return this._headers;
  }
  public setHeaders(headers: Readonly<Headers>): Readonly<Headers> {
    return Object.assign(this._headers, headers);
  }

  private _computeBody(): Buffer {
    const { json } = this;
    let { body } = this;

    if (body == null && !json) {
      body = '';
    }

    if (json) {
      body = stringifyPretty(body);
      this.setHeaders({ 'content-type': 'application/json' });
    }

    if (typeof body === 'string') {
      body = Buffer.from(body);
    }

    return body;
  }

  private _setHead() {
    const response = this.original;

    const headers = this._headers;

    let { status } = this;
    if (status == null) {
      status = {};
    }
    let { code } = status;
    if (code == null) {
      code = CONF.defaultStatusCode;
    }
    const { message } = status;

    Object.entries(headers)
      .map(([key, value]) => ({ key, value }))
      .filter((header) => header.value != null)
      .forEach((header) => {
        try {
          response.setHeader(header.key, header.value!);
        } catch (exception) {
          logError({
            message: `${CONF.messages.setHeaderError}\n${header.key}: ${header.value}`,
            exception,
          });
        }
      });
    response.writeHead(code, message);
  }

  public async send() {
    const body = this._computeBody();
    this._setHead();
    return new Promise<void>((resolve) => this.original.end(body, resolve));
  }
}
