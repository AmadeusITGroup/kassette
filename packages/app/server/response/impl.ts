// ------------------------------------------------------------------------- std

import { ServerResponse, IncomingHttpHeaders } from 'http';

// ---------------------------------------------------------------------- common

import { headersContainer } from '../../../lib/headers';
import { stringifyPretty } from '../../../lib/json';
import { UserProperty } from '../../../lib/user-property';
import { logError } from '../../logger';

// -------------------------------------------------------------------- internal

import { Status } from '../model';

import { IResponse } from './model';

// ------------------------------------------------------------------------ conf

import CONF from './conf';
import { Http2ServerResponse } from 'http2';

////////////////////////////////////////////////////////////////////////////////
// Model: Response
////////////////////////////////////////////////////////////////////////////////

/**
 * Implementation of the wrapper around a response.
 *
 * @param original The original response object (that can be retrieved through `original`)
 */
export class Response implements IResponse {
  private _body: any;
  private _json = new UserProperty({
    getDefaultInput: () => {
      const { body } = this;
      return body != null && typeof body !== 'string' && !Buffer.isBuffer(body);
    },
  });
  public status: Partial<Readonly<Status>> | null = null;

  private _headers = headersContainer();

  constructor(public readonly original: ServerResponse | Http2ServerResponse) {}

  set body(value: any) {
    this._body = value;
    this._json.resetInputCache();
  }
  get body(): any {
    return this._body;
  }

  get json(): boolean {
    return this._json.output;
  }
  set json(value: boolean) {
    this._json.set(value);
  }

  public setData(data: any) {
    this.json = true;
    this.body = data;
  }

  get headers(): Readonly<IncomingHttpHeaders> {
    return this._headers;
  }
  public setHeaders(headers?: Readonly<IncomingHttpHeaders>): Readonly<IncomingHttpHeaders> {
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
            message: `${CONF.messages.setHeaderError}\n${JSON.stringify(header)}`,
            exception,
          });
        }
      });
    if (response instanceof Http2ServerResponse) {
      response.writeHead(code);
    } else {
      response.writeHead(code, message);
    }
  }

  public async send() {
    const body = this._computeBody();
    this._setHead();
    return new Promise<void>((resolve) => this.original.end(body, resolve));
  }
}
