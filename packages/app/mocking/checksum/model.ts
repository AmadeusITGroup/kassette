import * as crypto from 'crypto';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export type DefaultInclude = boolean | null | undefined;

/**
 * Base interface used in {@link ChecksumArgs} for each piece of data that can be included or not in the hash computed
 * by the {@link IMock.checksum|checksum} method.
 *
 * @public
 */
export interface IncludableSpec {
  /**
   * Whether to include this piece of data in the hash. It is `true` by default (if an object is passed).
   */
  include?: boolean;
}

/**
 * Interface used in {@link ChecksumArgs} for each piece of data that can be filtered (i.e. modified) before it is included
 * in the hash computed by the {@link IMock.checksum|checksum} method.
 *
 * @public
 */
export interface FilterableSpec<I, O = I> extends IncludableSpec {
  /**
   * A function used to filter (i.e. modify) the piece of data before it is included in the hash.
   * If no function is given, the unmodified piece of data is used.
   * @param input - piece of data to filter
   * @returns The modified piece of data. Note that the filter function can optionally be
   * asynchronous, in which case it is expected to return a promise of the modified piece
   * of data.
   */
  filter?(input: I): O | Promise<O>;
}

/**
 * Type used in {@link ChecksumArgs} for each piece of data that has a map structure, such as the query and headers,
 * to specify if and how they are included in the hash computed by the {@link IMock.checksum|checksum} method.
 *
 * @remarks
 *
 * This can be an object with the following properties:
 *
 * - `include`: `true` or `false` as defined in {@link IncludableSpec.include|IncludableSpec}
 *
 * - `filter`: a function as defined in {@link FilterableSpec.filter|FilterableSpec}. Note that if filter is provided, the other options below are ignored.
 *
 * - `caseSensitive`: whether keys should be treated case sensitive or not. `true` by default. When set to `false`, the output object contains lower cased keys.
 *
 * - `keys`: a list of keys to keep if in `whitelist` mode or to reject if in `blacklist` mode. If `caseSensitive` is `false`, comparison of keys is not case sensitive.
 * If `keys` is not specified, all keys are included by default.
 *
 * - `mode`: `whitelist` (default) or `blacklist`
 *
 * @public
 */
export type ListOrFilter =
  | FilterableSpec<Record<string, any>, any>
  | (IncludableSpec & {
      /**
       * Configures whether keys are case sensitive (i.e. whether keys differing only with the case, such as `a` and `A`, are considered different).
       * If keys are not case sensitive, their case will be changed to lower case before being hashed or being compared with the provided whitelist or blacklist.
       * By default, keys are considered case sensitive for the query and case insensitive for the headers.
       */
      caseSensitive?: boolean;
    } & (
        | {}
        | {
            /**
             * Configures whether the list of keys is
             * a `whitelist` (specifying explicitly all the items to include, any other item being excluded)
             * or a `blacklist` (specifying explicitly all the items to exclude, any other item being included).
             * Defaults to `whitelist`.
             */
            mode?: 'whitelist' | 'blacklist';
            /**
             * The list of items to either include or exclude depending on the mode property.
             */
            keys: string[];
          }
      ));

export function isFilter(value: any): value is FilterableSpec<any> {
  return value.filter != null;
}

export function isListing(value: any): value is ListOrFilter & { keys: string[] } {
  return value.keys != null;
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * Type of the argument expected by {@link IMock.checksum|checksum}.
 * It specifies which data from the request to include in the checksum.
 *
 * @remarks
 * To include or exclude data, not every kind of data from the request has the
 * same complexity. For instance, the HTTP method is simple: use it or don't
 * use it. But for things like query parameters, headers, body: you might want to
 * select/filter.
 *
 * @public
 */
export interface ChecksumArgs {
  /**
   * Specifies the hash algorithm. Default value is `sha256`.
   * Check Node.js API for more information: {@link https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options|crypto.createHash(type)}.
   */
  type?: string;

  /**
   * Specifies the output format. Default value is `hex`.
   * Check Node.js API for more information: {@link https://nodejs.org/api/crypto.html#crypto_hash_digest_encoding|hash.digest(format)}.
   */
  format?: crypto.BinaryToTextEncoding;

  /**
   * Specifies whether to include the protocol in the hash. The default value is `false`.
   */
  protocol?: IncludableSpec | boolean;

  /**
   * Specifies whether and how to include the hostname in the hash. The default value is `false`.
   */
  hostname?: FilterableSpec<string> | boolean;

  /**
   * Specifies whether to include the port in the hash. The default value is `false`.
   */
  port?: IncludableSpec | boolean;

  /**
   * Specifies whether to include the method in the hash. The default value is `false`.
   */
  method?: IncludableSpec | boolean;

  /**
   * Specifies whether and how to include the pathname part of the url in the hash. The default value is `false`.
   */
  pathname?: FilterableSpec<string> | boolean;

  /**
   * Specifies whether and how to include the body of the request in the hash. The default value is `true`.
   */
  body?: FilterableSpec<Buffer, Buffer | string> | boolean;

  /**
   * Specifies whether and how to include the query part of the url in the hash. The default value is `true`.
   */
  query?: ListOrFilter | boolean;

  /**
   * Specifies whether and how to include the headers in the hash.
   * The default value is `false`.
   */
  headers?: ListOrFilter | boolean;

  /**
   * Any custom value (which can be JSON stringified) to be added in the content
   * to be hashed.
   */
  customData?: any | null;
}

export interface ChecksumReturn {
  content: string;
  checksum: string;
}
