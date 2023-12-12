import { HarFormat, HarFormatContent, HarFormatNameValuePair, HarFormatPostData } from './harTypes';
import { appendHeader, headersContainer } from '../headers';
import { extension } from 'mime-types';
import { isBinary } from 'istextorbinary';
import { IncomingHttpHeaders } from 'http';
import { stringifyPretty } from '../json';

export const emptyHar = (): HarFormat => ({
  log: {
    version: '1.2',
    creator: {
      name: 'kassette',
      /* The version is inserted here at build time by rollup: */
      version: process.env.KASSETTE_VERSION,
    },
    entries: [],
  },
});

export const rawHeadersToHarHeaders = (rawHeaders: string[]) => {
  const res: HarFormatNameValuePair[] = [];
  for (let i = 0, l = rawHeaders.length; i < l; i += 2) {
    res.push({
      name: rawHeaders[i],
      value: rawHeaders[i + 1],
    });
  }
  return res;
};

export const toHarHeaders = (headers?: Readonly<IncomingHttpHeaders>) => {
  const res: HarFormatNameValuePair[] = [];
  if (headers) {
    for (const name of Object.keys(headers)) {
      const values = headers[name];
      for (const value of Array.isArray(values) ? values : [values]) {
        if (value != null) {
          res.push({
            name,
            value: `${value}`,
          });
        }
      }
    }
  }
  return res;
};

export const fromHarHeaders = (harHeaders?: HarFormatNameValuePair[]) => {
  const headers = headersContainer();
  for (const header of harHeaders ?? []) {
    appendHeader(headers, header.name, header.value);
  }
  return headers;
};

export const toHarHttpVersion = (nodeHttpVersion?: string) => `HTTP/${nodeHttpVersion ?? '1.1'}`;
export const fromHarHttpVersion = (harHttpVersion?: string) =>
  harHttpVersion?.replace(/^HTTP\//i, '') ?? '1.1';

export const toHarContentBase64 = (body: Buffer, mimeType?: string): HarFormatContent => ({
  mimeType: mimeType ?? '',
  size: body.length,
  text: body.toString('base64'),
  encoding: 'base64',
});

export const toHarContent = (
  body: string | Buffer | null,
  mimeType?: string,
  parseMimeTypesAsJson: string[] = [],
): HarFormatContent => {
  if (Buffer.isBuffer(body)) {
    if (isBinary(mimeType ? `file.${extension(mimeType)}` : null, body)) {
      return toHarContentBase64(body, mimeType);
    }
    return {
      ...checkMimeTypeListAndParseBody(parseMimeTypesAsJson, body, mimeType),
      size: body?.length ?? 0,
    };
  }
  return {
    mimeType: mimeType ?? '',
    size: body?.length ?? 0,
    text: body ?? '',
  };
};

export const fromHarContent = (content?: HarFormatContent) => {
  if (content?.text !== undefined) {
    return Buffer.from(content.text, content.encoding === 'base64' ? 'base64' : 'binary');
  }
  if (content?.json !== undefined) {
    return Buffer.from(stringifyPretty(content.json), 'utf8');
  }
  return Buffer.alloc(0);
};

const checkMimeTypeListAndParseBody = (
  parseMimeTypesAsJson: string[],
  body: string | Buffer,
  mimeType?: string,
): HarFormatPostData => {
  const defaultTextReturn = {
    mimeType: mimeType ?? '',
    text: body.toString('binary'),
  };
  if (
    (mimeType && parseMimeTypesAsJson.includes(mimeType)) ||
    (!mimeType && parseMimeTypesAsJson.includes(''))
  ) {
    try {
      return {
        mimeType,
        json: JSON.parse(body.toString('utf-8')),
      };
    } catch (error) {
      return defaultTextReturn;
    }
  }
  return defaultTextReturn;
};

export const toHarPostData = (
  body?: string | Buffer,
  mimeType?: string,
  parseMimeTypesAsJson: string[] = [],
): HarFormatPostData | undefined => {
  if (body && body.length > 0) {
    return checkMimeTypeListAndParseBody(parseMimeTypesAsJson, body, mimeType);
  }
  return undefined;
};

export const toHarQueryString = (searchParams: URLSearchParams): HarFormatNameValuePair[] => {
  const res: HarFormatNameValuePair[] = [];
  for (const [name, value] of searchParams) {
    res.push({ name, value });
  }
  return res;
};
