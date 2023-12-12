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

import { Mode, Delay, MocksFormat } from '../configuration';

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
  RemotePayload,
} from './model';

import { computeChecksum } from './checksum/impl';
import { ChecksumArgs } from './checksum/model';

// ------------------------------------------------------------------------ conf

import CONF from './conf';
import {
  fromHarContent,
  fromHarHeaders,
  fromHarHttpVersion,
  rawHeadersToHarHeaders,
  toHarContent,
  toHarHeaders,
  toHarHttpVersion,
  toHarPostData,
  toHarQueryString,
} from '../../lib/har/harUtils';
import {
  HarFormatEntry,
  HarFormatNameValuePair,
  HarFormatPostData,
  HarFormatRequest,
} from '../../lib/har/harTypes';
import { callKeyManager, getHarFile, HarFile, HarKeyManager } from '../../lib/har/harFile';
import { headersContainer } from '../../lib/headers';
import { detectHarFormat } from '../../lib/har/formats';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

const isRemotePayload = (payload: PayloadWithOrigin): payload is RemotePayload =>
  payload.origin === 'remote' && 'requestOptions' in payload;

const splitFromHarHeaders = (
  headers?: HarFormatNameValuePair[],
): Pick<MockData, 'headers' | 'ignoredHeaders'> => {
  const mainHeaders: HarFormatNameValuePair[] = [];
  const ignoredHeaders: HarFormatNameValuePair[] = [];
  for (const header of headers ?? []) {
    (CONF.ignoredHeaders.has(header.name.toLowerCase()) ? ignoredHeaders : mainHeaders).push(
      header,
    );
  }
  return { headers: fromHarHeaders(mainHeaders), ignoredHeaders: fromHarHeaders(ignoredHeaders) };
};

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

  private _mocksHarFile = new UserProperty<NonSanitizedArray<string>, string>({
    getDefaultInput: () => this.options.userConfiguration.mocksHarFile.value,
    transform: ({ input }) => {
      const file = joinPath(input);
      return joinPath([nodePath.isAbsolute(file) ? null : this.options.root, file]);
    },
  });

  private _mocksHarKeyManager = new UserProperty<HarKeyManager>({
    getDefaultInput: () => this.options.userConfiguration.mocksHarKeyManager.value,
  });

  private _harMimeTypesParseJson = new UserProperty<Array<string>>({
    getDefaultInput: () => this.options.userConfiguration.harMimeTypesParseJson.value,
  });

  private _mockHarKey = new UserProperty<NonSanitizedArray<string>, string | undefined>({
    transform: ({ inputOrigin, input }) =>
      inputOrigin === 'none' ? this.defaultMockHarKey : joinPath(input),
  });

  private _mocksFormat = new UserProperty<MocksFormat>({
    getDefaultInput: () => this.options.userConfiguration.mocksFormat.value,
  });

  private _saveChecksumContent = new UserProperty<boolean>({
    getDefaultInput: () => this.options.userConfiguration.saveChecksumContent.value,
  });

  private _saveDetailedTimings = new UserProperty<boolean>({
    getDefaultInput: () => this.options.userConfiguration.saveDetailedTimings.value,
  });

  private _saveInputRequestData = new UserProperty<boolean>({
    getDefaultInput: () => this.options.userConfiguration.saveInputRequestData.value,
  });

  private _saveInputRequestBody = new UserProperty<boolean>({
    getDefaultInput: () => this.options.userConfiguration.saveInputRequestBody.value,
  });

  private _saveForwardedRequestData = new UserProperty<boolean | null>({
    getDefaultInput: () => this.options.userConfiguration.saveForwardedRequestData.value,
  });

  private _saveForwardedRequestBody = new UserProperty<boolean | null>({
    getDefaultInput: () => this.options.userConfiguration.saveForwardedRequestBody.value,
  });

  private _remoteURL = new UserProperty<string | null>({
    getDefaultInput: () => this.options.userConfiguration.remoteURL.value,
  });

  public sourcePayload: PayloadWithOrigin | undefined;

  private __localPayload: PayloadWithOrigin<'local' | 'user'> | undefined;
  private get _localPayload(): PayloadWithOrigin<'local' | 'user'> | undefined {
    return this.__localPayload;
  }
  private set _localPayload(payload: PayloadWithOrigin<'local' | 'user'> | undefined) {
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

  public get mocksFormat(): MocksFormat {
    return this._mocksFormat.output;
  }
  public setMocksFormat(value: MocksFormat | null): void {
    this._setUserProperty(this._mocksFormat, value);
  }

  public get saveChecksumContent(): boolean {
    return this._saveChecksumContent.output;
  }
  public setSaveChecksumContent(value: boolean | null): void {
    this._setUserProperty(this._saveChecksumContent, value);
  }

  public get saveDetailedTimings(): boolean {
    return this._saveDetailedTimings.output;
  }
  public setSaveDetailedTimings(value: boolean | null): void {
    this._setUserProperty(this._saveDetailedTimings, value);
  }

  public get saveInputRequestData(): boolean {
    return this._saveInputRequestData.output;
  }
  public setSaveInputRequestData(value: boolean | null): void {
    this._setUserProperty(this._saveInputRequestData, value);
  }

  public get saveInputRequestBody(): boolean {
    return this._saveInputRequestBody.output;
  }
  public setSaveInputRequestBody(value: boolean | null): void {
    this._setUserProperty(this._saveInputRequestBody, value);
  }

  public get saveForwardedRequestData(): boolean {
    return this._saveForwardedRequestData.output ?? this.mocksFormat === 'folder';
  }
  public setSaveForwardedRequestData(value: boolean | null): void {
    this._setUserProperty(this._saveForwardedRequestData, value);
  }

  public get saveForwardedRequestBody(): boolean {
    return this._saveForwardedRequestBody.output ?? this.mocksFormat === 'folder';
  }
  setSaveForwardedRequestBody(value: boolean | null): void {
    this._setUserProperty(this._saveForwardedRequestBody, value);
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

  public get mocksHarFile(): string {
    return this._mocksHarFile.output;
  }
  public setMocksHarFile(value: NonSanitizedArray<string> | null) {
    this._setUserProperty(this._mocksHarFile, value);
  }

  @CachedProperty()
  public get defaultMockHarKey(): string | undefined {
    return callKeyManager(this.mocksHarKeyManager, {
      request: { ...this._harFmtRequest, postData: this._harFmtPostData },
    });
  }

  public get mockHarKey(): string | undefined {
    return this._mockHarKey.output;
  }
  public setMockHarKey(value: NonSanitizedArray<string> | null) {
    this._setUserProperty(this._mockHarKey, value);
  }

  public get mocksHarKeyManager(): HarKeyManager {
    return this._mocksHarKeyManager.output;
  }
  public setMocksHarKeyManager(value: HarKeyManager | null) {
    this._setUserProperty(this._mocksHarKeyManager, value);
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

  public get harMimeTypesParseJson(): string[] {
    return this._harMimeTypesParseJson.output;
  }
  public setHarMimeTypesParseJson(value: string[]): void {
    this._setUserProperty(this._harMimeTypesParseJson, value);
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

  public async hasLocalMock(): Promise<boolean> {
    if (this.mocksFormat === 'folder') {
      return this._folderFmtDataFile.exists();
    } else {
      return !!(await this.readLocalPayload());
    }
  }
  public async hasNoLocalMock(): Promise<boolean> {
    return !(await this.hasLocalMock());
  }

  public async hasLocalFiles(): Promise<boolean> {
    this.logInfo({
      message: 'hasLocalFiles is deprecated! Please use hasLocalMock instead.',
      checked: false,
    });
    return this.hasLocalMock();
  }
  public async hasNoLocalFiles(): Promise<boolean> {
    this.logInfo({
      message: 'hasNoLocalFiles is deprecated! Please use hasNoLocalMock instead.',
      checked: false,
    });
    return this.hasNoLocalMock();
  }

  public checksumContent: string | null = null;
  public async checksum(spec: ChecksumArgs): Promise<string> {
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
      logError({ message: CONF.messages.requestFailed, exception });
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

  private _folderFmtCreateFileHandler(name: string): FileHandler {
    return new FileHandler({ root: this.mockFolderFullPath, name: name });
  }

  @CachedProperty()
  private get _folderFmtDataFile(): FileHandler {
    return this._folderFmtCreateFileHandler(CONF.dataFilename);
  }

  @CachedProperty()
  private get _folderFmtInputRequestFile(): FileHandler {
    return this._folderFmtCreateFileHandler(`${CONF.inputRequestBaseFilename}.json`);
  }

  @CachedProperty()
  private get _folderFmtForwardedRequestFile(): FileHandler {
    return this._folderFmtCreateFileHandler(`${CONF.forwardedRequestBaseFilename}.json`);
  }

  @CachedProperty()
  private get _folderFmtChecksumFile(): FileHandler {
    return this._folderFmtCreateFileHandler(CONF.checksumFilename);
  }

  @CachedProperty()
  private get _harFmtFile(): HarFile {
    return getHarFile(
      this.mocksHarFile,
      this.options.userConfiguration.harFileCacheTime.value,
      detectHarFormat(this.mocksHarFile),
    );
  }

  @CachedProperty()
  private get _harFmtRequest(): HarFormatRequest {
    return {
      method: this.request.original.method,
      url: this.request.url.href,
      httpVersion: toHarHttpVersion(this.request.original.httpVersion),
      headers: rawHeadersToHarHeaders(this.request.original.rawHeaders),
      cookies: [], // cookies parsing is not implemented
      queryString: toHarQueryString(this.request.url.searchParams),
      headersSize: -1,
      bodySize: this.request.body.length,
    };
  }

  @CachedProperty()
  private get _harFmtPostData(): HarFormatPostData | undefined {
    return toHarPostData(
      this.request.body,
      this.request.headers['content-type'],
      this.harMimeTypesParseJson,
    );
  }

  //////////////////////////////////////////////////////////////////////////////
  // Payload > Writing
  //////////////////////////////////////////////////////////////////////////////

  public async persistPayload(payload: PayloadWithOrigin) {
    switch (this.mocksFormat) {
      case 'folder':
        await this._folderFmtPersistPayload(payload);
        break;
      case 'har':
        await this._harFmtPersistPayload(payload);
        break;
    }
  }

  private async _folderFmtPersistPayload(payload: PayloadWithOrigin) {
    if (isRemotePayload(payload)) {
      await this._folderFmtPersistForwardedPayload(payload);
    }
    const {
      payload: { data, body },
    } = payload;
    const inputRequestDataFile = this.saveInputRequestData ? this._folderFmtInputRequestFile : null;
    const inputRequestBodyFile = this.saveInputRequestBody
      ? this._folderFmtCreateFileHandler(
          this._getBodyFileName(
            `${CONF.inputRequestBaseFilename}-body`,
            this.request.headers['content-type'],
          ),
        )
      : null;
    if (inputRequestDataFile) {
      this.logInfo({
        message: CONF.messages.writingInputRequestData,
        data: nodePath.relative(this.mocksFolder, inputRequestDataFile.path),
      });
      await inputRequestDataFile.write(
        stringifyPretty({
          headers: this.request.headers,
          method: this.request.method,
          url: this.request.url,
          bodyFileName: inputRequestBodyFile?.name,
        }),
      );
    }
    if (inputRequestBodyFile) {
      this.logInfo({
        message: CONF.messages.writingInputRequestBody,
        data: nodePath.relative(this.mocksFolder, inputRequestBodyFile.path),
      });
      await inputRequestBodyFile.write(this.request.body.toString());
    }

    if (this.saveChecksumContent && this.checksumContent != null) {
      const checksumFile = this._folderFmtChecksumFile;
      this.logInfo({
        message: CONF.messages.writingChecksumFile,
        data: nodePath.relative(this.mocksFolder, checksumFile.path),
      });
      await checksumFile.write(this.checksumContent);
    }

    const dataFile = this._folderFmtDataFile;
    this.logInfo({
      message: CONF.messages.writingData,
      data: nodePath.relative(this.mocksFolder, dataFile.path),
    });
    await dataFile.write(
      stringifyPretty(this.saveDetailedTimings ? data : { ...data, timings: undefined }),
    );

    const bodyFile = this._folderFmtCreateFileHandler(data.bodyFileName);
    this.logInfo({
      message: CONF.messages.writingBody,
      data: nodePath.relative(this.mocksFolder, bodyFile.path),
    });
    await bodyFile.write(body);
  }

  private async _harFmtPersistPayload(payload: PayloadWithOrigin) {
    const {
      payload: { data, body },
    } = payload;
    this.logInfo({
      message: CONF.messages.writingHarFile,
      data: this._harFmtFile.path,
    });
    const harMimeTypesParseJson = this.harMimeTypesParseJson;
    const entry: HarFormatEntry = {
      _kassetteChecksumContent:
        this.saveChecksumContent && this.checksumContent ? this.checksumContent : undefined,
      startedDateTime: data.creationDateTime
        ? new Date(data.creationDateTime.getTime() - data.time).toISOString()
        : undefined,
      time: data.time,
      timings: this.saveDetailedTimings ? data.timings : undefined,
      cache: {},
      response: {
        httpVersion: toHarHttpVersion(data.httpVersion),
        status: data.status.code,
        statusText: data.status.message,
        headers: toHarHeaders(data.headers).concat(toHarHeaders(data.ignoredHeaders)),
        redirectURL: (data.headers?.location as any) ?? '',
        cookies: [], // cookies parsing is not implemented
        headersSize: -1,
        bodySize: body?.length ?? 0,
        content: toHarContent(body, data.headers?.['content-type'], harMimeTypesParseJson),
      },
    };
    if (this.saveInputRequestData) {
      entry.request = { ...this._harFmtRequest };
    }
    if (this.saveInputRequestBody) {
      if (!entry.request) {
        entry.request = {};
      }
      entry.request.postData = this._harFmtPostData;
    }
    if (isRemotePayload(payload)) {
      if (this.saveForwardedRequestData) {
        entry._kassetteForwardedRequest = {
          method: payload.requestOptions.method.toUpperCase(),
          url: payload.requestOptions.url,
          httpVersion: entry.response?.httpVersion,
          headers: toHarHeaders(payload.requestOptions.headers),
          cookies: [], // cookies parsing is not implemented
          queryString: toHarQueryString(new URL(payload.requestOptions.url).searchParams),
          headersSize: -1,
          bodySize: payload.requestOptions.body?.length ?? 0,
        };
      }
      if (this.saveForwardedRequestBody) {
        if (!entry._kassetteForwardedRequest) {
          entry._kassetteForwardedRequest = {};
        }
        entry._kassetteForwardedRequest.postData = toHarPostData(
          payload.requestOptions.body,
          payload.requestOptions.headers['content-type'],
          this.harMimeTypesParseJson,
        );
      }
    }

    await this._harFmtFile.setEntry(this.mockHarKey, entry, this.mocksHarKeyManager);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Payload > Reading / creation
  //////////////////////////////////////////////////////////////////////////////

  private _createPayloadFromResponse({ response, time, timings }: SendRequestOutput): Payload {
    const headers = headersContainer();
    const ignoredHeaders = headersContainer();
    Object.entries(response.headers).forEach(([header, value]) => {
      if (value == null) {
        return;
      }
      const container = CONF.ignoredHeaders.has(header.toLowerCase()) ? ignoredHeaders : headers;
      (container as any)[header] = value;
    });

    return {
      body: response.body,
      data: {
        httpVersion: response.original.httpVersion,
        headers,
        ignoredHeaders,
        status: response.status,
        bodyFileName: this._getBodyFileName('body', response.headers['content-type']),
        time,
        timings,
        creationDateTime: new Date(),
      },
    };
  }

  public createPayload(payload: Payload): PayloadWithOrigin<'user'> {
    return { origin: 'user', payload };
  }

  public async readLocalPayload(): Promise<PayloadWithOrigin<'local' | 'user'> | undefined> {
    if (this._localPayload != null) {
      return this._localPayload;
    }
    let payload: Payload;
    switch (this.mocksFormat) {
      case 'folder': {
        const fileContent = await this._folderFmtDataFile.read();
        if (!fileContent) {
          return;
        }
        const data: MockData = JSON.parse(fileContent.toString(), (key, value) =>
          key !== 'creationDateTime' || key == null ? value : new Date(value),
        );
        payload = {
          data,
          body: await this._folderFmtCreateFileHandler(data.bodyFileName).read(),
        };
        break;
      }
      case 'har': {
        const entry = await this._harFmtFile.getEntry(this.mockHarKey, this.mocksHarKeyManager);
        if (!entry || !entry.response) {
          return;
        }
        const creationDateTime = new Date(entry.startedDateTime!);
        creationDateTime.setTime(creationDateTime.getTime() + entry.time!);
        const data: MockData = {
          creationDateTime,
          bodyFileName: '',
          status: {
            code: entry.response.status!,
            message: entry.response.statusText!,
          },
          time: entry.time!,
          timings: entry.timings ? { ...entry.timings } : undefined,
          httpVersion: fromHarHttpVersion(entry.response.httpVersion),
          ...splitFromHarHeaders(entry.response.headers),
        };
        payload = {
          data,
          body: fromHarContent(entry.response.content),
        };
        break;
      }
    }

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

  private async _getLocalPayload(): Promise<PayloadWithOrigin<'local' | 'user' | 'proxy'>> {
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

    await this.persistPayload(remotePayload);

    return remotePayload;
  }

  private async _folderFmtPersistForwardedPayload(remotePayload: RemotePayload) {
    const forwardedRequestDataFile = this.saveForwardedRequestData
      ? this._folderFmtForwardedRequestFile
      : null;
    const forwardedRequestBodyFile = this.saveForwardedRequestBody
      ? this._folderFmtCreateFileHandler(
          this._getBodyFileName(
            `${CONF.forwardedRequestBaseFilename}-body`,
            remotePayload.requestOptions.headers['content-type'],
          ),
        )
      : null;
    if (forwardedRequestDataFile) {
      this.logInfo({
        message: CONF.messages.writingForwardedRequestData,
        data: nodePath.relative(this.mocksFolder, forwardedRequestDataFile.path),
      });
      await forwardedRequestDataFile.write(
        stringifyPretty({
          bodyType: remotePayload.requestOptions.body instanceof Buffer ? 'buffer' : 'string',
          headers: remotePayload.requestOptions.headers,
          method: remotePayload.requestOptions.method,
          url: remotePayload.requestOptions.url,
          bodyFileName: forwardedRequestBodyFile?.name,
        }),
      );
    }
    if (forwardedRequestBodyFile) {
      this.logInfo({
        message: CONF.messages.writingForwardedRequestBody,
        data: nodePath.relative(this.mocksFolder, forwardedRequestBodyFile.path),
      });
      await forwardedRequestBodyFile.write(remotePayload.requestOptions.body?.toString());
    }
  }

  public async readOrDownloadPayload(): Promise<
    PayloadWithOrigin<'local' | 'user'> | RemotePayload
  > {
    const localPayload = await this.readLocalPayload();
    if (localPayload != null) {
      this.logInfo({ message: CONF.messages.alreadyExistingMock });
      return localPayload;
    }

    this.logInfo({ message: CONF.messages.fetchingMock });
    return this.downloadPayload();
  }

  public async readOrFetchPayload(): Promise<PayloadWithOrigin<'local' | 'user'> | RemotePayload> {
    const localPayload = await this.readLocalPayload();
    if (localPayload != null) {
      this.logInfo({ message: CONF.messages.alreadyExistingMock });
      return localPayload;
    }

    this.logInfo({ message: CONF.messages.fetchingMock });
    return this.fetchPayload();
  }

  public setPayload(payload: PayloadWithOrigin<'local' | 'user'>) {
    this._localPayload = payload;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Request / Response
  //////////////////////////////////////////////////////////////////////////////

  private async _sendRequestToOriginalServer() {
    let baseUrl = this.remoteURL;

    if (!baseUrl) {
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
