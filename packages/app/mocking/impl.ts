// ------------------------------------------------------------------------- std

import * as nodePath from 'path';

// ------------------------------------------------------------------------- 3rd

import { extension as mimeTypeToExtension } from 'mime-types';

// ---------------------------------------------------------------------- common

import { CachedProperty } from '../../lib/oop';
import { NonSanitizedArray, flatten } from '../../lib/array';
import { stringifyPretty } from '../../lib/json';
import { getPathParts as getURLPathParts } from '../../lib/url';
import { joinPath } from '../../lib/path';
import { FileHandler } from '../../lib/fs';
import { UserProperty } from '../../lib/user-property';

// ------------------------------------------------------------------------- app

import { logInfo, logSeparator, LogPayload, logError } from '../logger';
import { MissingRemoteURLError } from '../error';

import { Mode, Delay } from '../configuration';

import { SendRequestOutput } from '../server/model';
import { IResponse } from '../server/response/model';
import { IFetchedRequest } from '../server/request/model';

import { sendRequest } from '../server/requesting';

// -------------------------------------------------------------------- internal

import {
  IMock,
  MockSpec,
  MockingOptions,
  MockData,
  PayloadWithOrigin,
  Payload,
  LocalPayload,
  NotFoundPayload,
  RemotePayload,
  UserPayload,
} from './model';

import { computeChecksum } from './checksum/impl';
import { ChecksumArgs } from './checksum/model';

// ------------------------------------------------------------------------ conf

import CONF from './conf';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export class Mock implements IMock {
  //////////////////////////////////////////////////////////////////////////////
  // Properties & constructor
  //////////////////////////////////////////////////////////////////////////////

  private _localPath = new UserProperty<NonSanitizedArray<string>, string>({
    transform: ({ inputOrigin, input }) =>
      inputOrigin === 'none' ? this.defaultLocalPath : joinPath(input),
  });

  private _delay = new UserProperty<Delay, number>({
    getDefaultInput: () => this.options.userConfiguration.delay.value,
    transform: ({ input }) => {
      if (input === 'recorded' && this._localPayload != null) {
        return this._localPayload.payload.data.time;
      }

      if (input == null || input === 'recorded') {
        return CONF.emptyPayload.data.time;
      }

      return input;
    },
  });

  private _skipLog = new UserProperty<boolean, boolean>({
    getDefaultInput: () => this.options.userConfiguration.skipLog.value,
  });

  private _mode = new UserProperty<Mode>({
    getDefaultInput: () => this.options.userConfiguration.mode.value,
  });

  private _mocksFolder = new UserProperty<NonSanitizedArray<string>, string>({
    getDefaultInput: () => this.options.userConfiguration.mocksFolder.value,
    transform: ({ input }) => {
      const folder = joinPath(input);
      return joinPath([nodePath.isAbsolute(folder) ? null : this.options.root, folder]);
    },
  });

  private _remoteURL = new UserProperty<string | null>({
    getDefaultInput: () => this.options.userConfiguration.remoteURL.value,
  });

  public sourcePayload: PayloadWithOrigin | undefined;

  private __localPayload: LocalPayload | UserPayload | undefined;
  private get _localPayload(): LocalPayload | UserPayload | undefined {
    return this.__localPayload;
  }
  private set _localPayload(payload: LocalPayload | UserPayload | undefined) {
    this.__localPayload = payload;
    this._delay.resetOutputCache();
  }

  private _fetchedPayload: RemotePayload | undefined;

  private _processed = false;

  constructor(private readonly _spec: MockSpec) {}

  //////////////////////////////////////////////////////////////////////////////
  // Nested properties
  //////////////////////////////////////////////////////////////////////////////

  @CachedProperty()
  get options(): MockingOptions {
    return this._spec.options;
  }
  @CachedProperty()
  get request(): IFetchedRequest {
    return this._spec.request;
  }
  @CachedProperty()
  get response(): IResponse {
    return this._spec.response;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Properties
  //////////////////////////////////////////////////////////////////////////////

  private _setUserProperty<T>(property: UserProperty<T>, value: T) {
    if (value == null) {
      property.unset();
    } else {
      property.set(value);
    }
  }

  public get mode(): Mode {
    return this._mode.output;
  }
  public setMode(value: Mode | null) {
    this._setUserProperty(this._mode, value);
  }

  public get remoteURL(): string | null {
    return this._remoteURL.output;
  }
  public setRemoteURL(value: string | null) {
    this._setUserProperty(this._remoteURL, value);
  }

  public get mocksFolder(): string {
    return this._mocksFolder.output;
  }
  public setMocksFolder(value: NonSanitizedArray<string> | null) {
    this._setUserProperty(this._mocksFolder, value);
  }

  public get delay(): number {
    return this._delay.output;
  }
  public setDelay(value: Delay | null) {
    this._setUserProperty(this._delay, value);
  }

  public get skipLog(): boolean {
    return this._skipLog.output;
  }
  public setSkipLog(value: boolean) {
    this._setUserProperty(this._skipLog, value);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Path management
  //////////////////////////////////////////////////////////////////////////////

  public setLocalPath(value: NonSanitizedArray<string>): void {
    this._localPath.set(value);
  }
  get localPath(): string {
    return this._localPath.output;
  }

  @CachedProperty()
  get defaultLocalPath(): string {
    return flatten([getURLPathParts(this.request.url), this.request.method])
      .join('/')
      .split('/')
      .filter((part) => part !== '')
      .join('/');
  }

  get mockFolderFullPath(): string {
    return nodePath.join(this.mocksFolder, this.localPath);
  }

  get hash(): string {
    return getURLPathParts(this.request.url).join('/');
  }

  public async hasLocalFiles(): Promise<boolean> {
    return this.dataFile.exists();
  }
  public async hasNoLocalFiles(): Promise<boolean> {
    return !(await this.hasLocalFiles());
  }

  public checksumContent: string | null = null;
  public async checksum(spec: ChecksumArgs) {
    const { checksum, content } = await computeChecksum(this, spec);
    this.checksumContent = content;
    return checksum;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Processing
  //////////////////////////////////////////////////////////////////////////////

  private logInfo(spec: LogPayload) {
    if (!this.skipLog) {
      logInfo(spec);
    }
  }

  private logSeparator() {
    if (!this.skipLog) {
      logSeparator();
    }
  }

  public async readLocalPayloadAndFillResponse(): Promise<boolean> {
    const payload = await this.readLocalPayload();
    if (payload == null) {
      return false;
    }
    this.fillResponseFromPayload(payload);
    return true;
  }

  public async sendResponse() {
    if (this.sourcePayload == null) {
      this.logInfo({
        message: 'Sending response with no delay since cannot determine the source payload',
      });
    } else if (this.sourcePayload.origin === 'remote') {
      this.logInfo({ message: 'Sending response with no delay since fetched from server' });
    } else {
      const time = this.delay;
      this.logInfo({
        message: 'Sending response with the following delay (value / original / from)',
        data: `${time} / ${this._delay.input} / ${this._delay.inputOrigin}`,
      });
      if (time > 0) {
        await new Promise((resolve) => setTimeout(resolve, time));
      }
    }

    this.response.send();
  }

  public async getPayloadAndFillResponse() {
    const { mode } = this;

    if (mode === 'manual') {
      return;
    }

    const fetchedPayload = await {
      local_or_remote: () => this.readOrFetchPayload(),
      local_or_download: () => this.readOrDownloadPayload(),
      remote: () => this.fetchPayload(),
      local: () => this._getLocalPayload(),
      download: () => this.downloadPayload(),
    }[mode]();

    this.fillResponseFromPayload(fetchedPayload);
  }

  public async process() {
    if (this._processed) {
      return;
    }
    this._processed = true;

    const { mode } = this;

    if (mode === 'manual') {
      this.logInfo({ message: 'Manual mode on, not doing anything' });
      this.logSeparator();
      return;
    }

    if (mode === 'remote') {
      this.logInfo({
        message: 'Local mock skipped by the user, simply forwarding remote server response',
      });
    }

    try {
      await this.getPayloadAndFillResponse();
    } catch (exception) {
      logError({ message: exception.message, exception: exception.original! });
      await this.fillResponseFromPayload({
        origin: 'proxy',
        payload: {
          body: `kassette error:\n\n${exception.message}`,
          data: {
            creationDateTime: new Date(),
            status: {
              code: 502,
              message: 'Bad Gateway',
            },
            headers: {
              'content-type': 'text/plain',
            },
            bodyFileName: '',
            ignoredHeaders: {},
            time: 0,
          },
        },
      });
    }
    await this.sendResponse();
    this.logSeparator();
  }

  //////////////////////////////////////////////////////////////////////////////
  // Files management
  //////////////////////////////////////////////////////////////////////////////

  private _getBodyFileName(baseName: string, contentType: string | null | undefined): string {
    const extension = contentType == null ? false : mimeTypeToExtension(contentType);
    if (extension === false) return baseName;
    return `${baseName}.${extension}`;
  }

  private _createFileHandler(name: string): FileHandler {
    return new FileHandler({ root: this.mockFolderFullPath, name: name });
  }

  @CachedProperty()
  private get dataFile(): FileHandler {
    return this._createFileHandler(CONF.dataFilename);
  }

  @CachedProperty()
  private get inputRequestFile(): FileHandler {
    return this._createFileHandler(`${CONF.inputRequestBaseFilename}.json`);
  }

  @CachedProperty()
  private get forwardedRequestFile(): FileHandler {
    return this._createFileHandler(`${CONF.forwardedRequestBaseFilename}.json`);
  }

  @CachedProperty()
  private get checksumFile(): FileHandler {
    return this._createFileHandler(CONF.checksumFilename);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Payload > Writing
  //////////////////////////////////////////////////////////////////////////////

  public async persistPayload({ payload: { data, body } }: PayloadWithOrigin) {
    const { dataFile, inputRequestFile, checksumFile } = this;
    const bodyFile = this._createFileHandler(data.bodyFileName);

    this.logInfo({
      message: CONF.messages.writingInputRequest,
      data: nodePath.relative(this.mocksFolder, inputRequestFile.path),
    });
    const inputRequestBodyFile = this._createFileHandler(
      this._getBodyFileName(
        `${CONF.inputRequestBaseFilename}-body`,
        this.request.headers['content-type'],
      ),
    );
    await inputRequestFile.write(
      stringifyPretty({
        headers: this.request.headers,
        method: this.request.method,
        url: this.request.url,
        bodyFileName: inputRequestBodyFile.name,
      }),
    );
    await inputRequestBodyFile.write(this.request.body.toString());

    if (this.checksumContent != null) {
      this.logInfo({
        message: CONF.messages.writingChecksumFile,
        data: nodePath.relative(this.mocksFolder, checksumFile.path),
      });
      await checksumFile.write(this.checksumContent);
    }

    this.logInfo({
      message: CONF.messages.writingData,
      data: nodePath.relative(this.mocksFolder, dataFile.path),
    });
    await dataFile.write(stringifyPretty(data));

    this.logInfo({
      message: CONF.messages.writingBody,
      data: nodePath.relative(this.mocksFolder, bodyFile.path),
    });
    await bodyFile.write(body);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Payload > Reading / creation
  //////////////////////////////////////////////////////////////////////////////

  private _createPayloadFromResponse({ response, time }: SendRequestOutput): Payload {
    const headers = {};
    const ignoredHeaders = {};
    Object.entries(response.headers).forEach(([header, value]) => {
      if (value == null) {
        return;
      }
      const container = CONF.ignoredHeaders.includes(header) ? ignoredHeaders : headers;
      (container as any)[header] = value;
    });

    return {
      body: response.body,
      data: {
        headers,
        ignoredHeaders,
        status: response.status,
        bodyFileName: this._getBodyFileName('body', response.headers['content-type']),
        time,
        creationDateTime: new Date(),
      },
    };
  }

  public createPayload(payload: Payload): UserPayload {
    return { origin: 'user', payload };
  }

  public async readLocalPayload(): Promise<LocalPayload | UserPayload | undefined> {
    if (this._localPayload != null) {
      return this._localPayload;
    }
    if (await this.hasNoLocalFiles()) {
      return;
    }

    const data: MockData = JSON.parse((await this.dataFile.read())!.toString(), (key, value) =>
      key !== 'creationDateTime' || key == null ? value : new Date(value),
    );
    const payload = {
      data: data,
      body: await this._createFileHandler(data.bodyFileName).read(),
    };
    return (this._localPayload = { origin: 'local', payload });
  }

  //////////////////////////////////////////////////////////////////////////////
  // Processing
  //////////////////////////////////////////////////////////////////////////////

  public async fetchPayload(): Promise<RemotePayload> {
    if (this._fetchedPayload != null) {
      return this._fetchedPayload;
    }

    const output = await this._sendRequestToOriginalServer();
    return (this._fetchedPayload = {
      origin: 'remote',
      payload: await this._createPayloadFromResponse(output),
      requestOptions: output.requestOptions,
    });
  }

  private async _getLocalPayload(): Promise<LocalPayload | UserPayload | NotFoundPayload> {
    this.logInfo({ message: CONF.messages.servingMockDirectly });

    if (this._localPayload != null) {
      return this._localPayload;
    }

    const localPayload = await this.readLocalPayload();
    if (localPayload != null) {
      return localPayload;
    }

    this.logInfo({ message: CONF.messages.inexistentMock });
    return {
      origin: 'proxy',
      payload: {
        body: '',
        data: {
          creationDateTime: new Date(),
          status: {
            code: 404,
            message: 'Not found',
          },
          headers: {},
          bodyFileName: '',
          ignoredHeaders: {},
          time: 0,
        },
      },
    };
  }

  public async downloadPayload(): Promise<RemotePayload> {
    const remotePayload = await this.fetchPayload();

    const { forwardedRequestFile } = this;
    this.logInfo({
      message: CONF.messages.writingForwardedRequest,
      data: nodePath.relative(this.mocksFolder, forwardedRequestFile.path),
    });
    const forwardedRequestBodyFile = this._createFileHandler(
      this._getBodyFileName(
        `${CONF.forwardedRequestBaseFilename}-body`,
        remotePayload.requestOptions.headers['content-type'],
      ),
    );
    await forwardedRequestFile.write(
      stringifyPretty({
        bodyType: remotePayload.requestOptions.body instanceof Buffer ? 'buffer' : 'string',
        headers: remotePayload.requestOptions.headers,
        method: remotePayload.requestOptions.method,
        url: remotePayload.requestOptions.url,
        bodyFileName: forwardedRequestBodyFile.name,
      }),
    );
    await forwardedRequestBodyFile.write(remotePayload.requestOptions.body.toString());

    await this.persistPayload(remotePayload);

    return remotePayload;
  }

  public async readOrDownloadPayload(): Promise<LocalPayload | UserPayload | RemotePayload> {
    const localPayload = await this.readLocalPayload();
    if (localPayload != null) {
      this.logInfo({ message: CONF.messages.alreadyExistingMock });
      return localPayload;
    }

    this.logInfo({ message: CONF.messages.fetchingMock });
    return this.downloadPayload();
  }

  public async readOrFetchPayload(): Promise<LocalPayload | UserPayload | RemotePayload> {
    const localPayload = await this.readLocalPayload();
    if (localPayload != null) {
      this.logInfo({ message: CONF.messages.alreadyExistingMock });
      return localPayload;
    }

    this.logInfo({ message: CONF.messages.fetchingMock });
    return this.fetchPayload();
  }

  public setPayload(payload: LocalPayload | UserPayload) {
    this._localPayload = payload;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Request / Response
  //////////////////////////////////////////////////////////////////////////////

  private async _sendRequestToOriginalServer() {
    let baseUrl = this.remoteURL;

    if (baseUrl == null) {
      throw new MissingRemoteURLError();
    } else if (baseUrl === '*') {
      baseUrl = this.request.url.toString();
    }

    return sendRequest({
      baseUrl,
      original: this.request,
      skipLog: this.skipLog,
    });
  }

  public fillResponseFromPayload(payload: PayloadWithOrigin) {
    if (this.sourcePayload != null) {
      return;
    }

    this.sourcePayload = payload;

    const {
      payload: { data, body },
    } = payload;

    const { response } = this;

    if (data != null) {
      response.setHeaders(data.headers);
      response.status = data.status;
    }

    if (body != null) {
      response.body = body;
    }
  }
}
