// ------------------------------------------------------------------------- std

import * as nodePath from 'path';

// ------------------------------------------------------------------------- 3rd

// @ts-ignore
import { prepare } from 'rechoir';
// @ts-ignore
import { extensions } from 'interpret';

// -------------------------------------------------------------------- internal

import { sanitize } from './array';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export interface LoadSpec {
  path: string;
  reload?: boolean;
  register?: boolean;
}

export interface LoadResult<Module = any> {
  loaded: boolean;
  module?: Module;
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export async function load<Module = any>({
  path,
  reload = false,
  register = true,
}: LoadSpec): Promise<LoadResult<Module>> {
  let registered;

  if (!register) {
    registered = true;
  } else {
    const basePath = nodePath.dirname(path);

    const filenameParts = nodePath
      .basename(path)
      .split('.')
      .filter((part) => part.length > 0);

    if (filenameParts.length >= 1) {
      filenameParts.shift();
    }

    filenameParts.reverse();
    const paths = filenameParts
      .reduce<
        string[][]
      >((extensionsList, currentPart): any => [sanitize([currentPart, extensionsList[0]]), ...extensionsList], [])
      .map((extension) => nodePath.join(basePath, ['index', ...extension].join('.'))); // "index" is just a dummy name, it could be anything

    registered =
      paths.findIndex((testPath) => {
        try {
          prepare(extensions, testPath);
          return true;
        } catch (exception) {
          return false;
        }
      }) !== -1;
  }

  if (reload && registered) {
    delete require.cache[require.resolve(path)];
  }

  return !registered ? { loaded: false } : { loaded: true, module: await import(path) };
}
