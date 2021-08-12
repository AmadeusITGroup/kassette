import * as crypto from 'crypto';

import { sanitize, NonSanitizedArray } from '../../../lib/array';
import { stringifyPretty } from '../../../lib/json';

import { IMock } from '../model';

import {
  ChecksumArgs,
  ChecksumReturn,
  DefaultInclude,
  IncludableSpec,
  isFilter,
  isListing,
  ListOrFilter,
  FilterableSpec,
} from './model';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export async function computeChecksum(mock: IMock, spec: ChecksumArgs): Promise<ChecksumReturn> {
  const type = spec.type ?? 'sha256';
  const format = spec.format ?? 'hex';

  const content = await computeContent(mock, spec);
  const checksum = crypto.createHash(type).update(content).digest(format);

  return { checksum, content };
}

function identity<T = any>(value: T): T {
  return value;
}

export async function computeContent(mock: IMock, spec: ChecksumArgs): Promise<string> {
  const parts: NonSanitizedArray = [];

  function push(header: string, data: string | null, includeWhenNull = true) {
    if (data != null || includeWhenNull) {
      parts.push(header, data, '');
    }
  }

  push(
    'protocol',
    await processSpec<IncludableSpec>(spec.protocol, false, () => {
      return mock.request.protocol.toLowerCase();
    }),
    false,
  );

  push(
    'hostname',
    await processSpec<FilterableSpec<string>>(spec.hostname, false, async (spec) => {
      const filter = spec.filter ?? identity;
      return await filter(mock.request.hostname.toLowerCase());
    }),
    false,
  );

  push(
    'port',
    await processSpec<IncludableSpec>(spec.port, false, () => {
      return mock.request.port;
    }),
    false,
  );

  push(
    'method',
    await processSpec<IncludableSpec>(spec.method, false, () => {
      return mock.request.method.toLowerCase();
    }),
  );

  push(
    'pathname',
    await processSpec<FilterableSpec<string>>(spec.pathname, false, async (spec) => {
      const filter = spec.filter ?? identity;
      return await filter(mock.request.pathname);
    }),
  );

  push(
    'body',
    await processSpec<FilterableSpec<Buffer, Buffer | string>>(spec.body, true, async (spec) => {
      const filter = spec.filter ?? identity;
      return (await filter(mock.request.body)).toString();
    }),
  );

  push(
    'query',
    await processSpec<ListOrFilter>(spec.query, true, async (spec) => {
      return await processList(spec, mock.request.queryParameters, true);
    }),
  );

  push(
    'headers',
    await processSpec<ListOrFilter>(spec.headers, false, async (spec) => {
      return await processList(spec, mock.request.headers, false);
    }),
  );

  push('custom data', stringifyPretty(spec.customData));

  return sanitize(parts).join('\n');
}

export async function processList(
  spec: ListOrFilter,
  input: Record<string, any>,
  defaultCaseSensitive: boolean,
): Promise<string> {
  let output;

  if (isFilter(spec)) {
    output = await spec.filter!(input);
  } else {
    const caseSensitive = spec.caseSensitive ?? defaultCaseSensitive;
    let properties;

    if (!isListing(spec)) {
      properties = Object.keys(input);
    } else {
      const mode = spec.mode ?? 'whitelist';
      const keys = spec.keys ?? [];
      if (mode === 'whitelist') {
        properties = keys;
      } else {
        let disallowedKeys = keys;
        if (!caseSensitive) disallowedKeys = disallowedKeys.map((key) => key.toLowerCase());

        properties = [];
        for (const key of Object.keys(input)) {
          let checkedKey = key;
          if (!caseSensitive) checkedKey = checkedKey.toLowerCase();

          if (!disallowedKeys.includes(checkedKey)) properties.push(key);
        }
      }
    }
    output = {} as any;
    for (const key of properties) {
      let targetKey = key;
      if (!caseSensitive) targetKey = targetKey.toLowerCase();
      output[targetKey] = input[key];
    }
  }

  return stringifyPretty(output);
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export async function processSpec<SpecType>(
  spec: SpecType | boolean | undefined,
  includedByDefault: DefaultInclude,
  process: (spec: SpecType) => string | Promise<string>,
): Promise<string | null> {
  const newSpec = normalizeSpec(spec, includedByDefault);
  if (!newSpec.include) return null;
  return await process(newSpec);
}

export function normalizeSpec<SpecType extends IncludableSpec>(
  spec: SpecType | boolean | undefined,
  defaultValue?: DefaultInclude,
): any {
  if (spec === true) return { include: true };
  if (spec === false) return { include: false };
  if (spec == null) {
    if (defaultValue != null) return { include: defaultValue };
    return { include: false };
  }
  if (spec.include == null) return Object.assign({}, spec, { include: true });
  return spec as { include: boolean };
}
