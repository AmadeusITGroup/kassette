// ------------------------------------------------------------------------- std

import { URL } from 'url';

// -------------------------------------------------------------------- internal

import { safeBuildString } from './string';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/** splits the `url` path portion into an array of path parts */
export const splitPath = (path: string): string[] => path.split('/');

/** returns the array of path parts of the given Node.js `url` */
export const getPathParts = ({ pathname }: URL): string[] =>
  pathname === '/' ? [] : splitPath(pathname).slice(1);

export interface URLSpec {
  /** including the `:` */
  protocol: string;
  hostname: string;
  port?: string | null | undefined;
  pathname?: string;
  search?: string;
}

/** builds an URL from the given `URLSpec` object */
export const build = ({ protocol, hostname, port, pathname, search }: URLSpec): string =>
  safeBuildString([
    [protocol, protocol.endsWith(':') ? null : ':'],
    '//',
    hostname,
    port == null ? null : [':', port],
    pathname == null ? null : [pathname.startsWith('/') ? null : '/', pathname],
    search == null || search === '' ? null : [search.startsWith('?') ? null : '?', search],
  ]);
