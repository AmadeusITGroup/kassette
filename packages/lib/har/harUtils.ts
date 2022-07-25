import { HarFormat, HarFormatContent, HarFormatNameValuePair, HarFormatPostData } from './harTypes';
import { appendHeader, headersContainer } from '../headers';
import { extension } from 'mime-types';
import { isBinary } from 'istextorbinary';
import { IncomingHttpHeaders } from 'http';

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

export const toHarContent = (body: string | Buffer | null, mimeType?: string): HarFormatContent => {
  if (Buffer.isBuffer(body)) {
    if (isBinary(mimeType ? `file.${extension(mimeType)}` : null, body)) {
      return toHarContentBase64(body, mimeType);
    }

    return {
      mimeType: mimeType ?? '',
      size: body?.length ?? 0,
      text: body.toString('binary'),
    };
  }
  return {
    mimeType: mimeType ?? '',
    size: body?.length ?? 0,
    text: body ?? '',
  };
};

export const fromHarContent = (content?: HarFormatContent) => {
  if (content?.text) {
    return Buffer.from(content.text, content.encoding === 'base64' ? 'base64' : 'binary');
  }
  return Buffer.alloc(0);
};

export const toHarPostData = (
  body?: string | Buffer,
  mimeType?: string,
): HarFormatPostData | undefined =>
  body && body.length > 0
    ? {
        mimeType: mimeType,
        text: body.toString('binary'),
      }
    : undefined;

export const toHarQueryString = (searchParams: URLSearchParams): HarFormatNameValuePair[] => {
  const res: HarFormatNameValuePair[] = [];
  for (const [name, value] of searchParams) {
    res.push({ name, value });
  }
  return res;
};
