import * as crypto from 'crypto';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export type DefaultInclude = boolean | null | undefined;

/**
 * @public
 */
export interface IncludableSpec {
  include?: boolean;
}

/**
 * @public
 */
export interface FilterableSpec<I, O = I> extends IncludableSpec {
  filter?(input: I): O | Promise<O>;
}

/**
 * @public
 */
export type ListOrFilter =
  | FilterableSpec<Record<string, any>, any>
  | (IncludableSpec & { caseSensitive?: boolean } & (
        | {}
        | {
            mode?: 'whitelist' | 'blacklist';
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
 * @public
 */
export interface ChecksumArgs {
  type?: string;
  format?: crypto.BinaryToTextEncoding;

  protocol?: IncludableSpec | boolean;
  hostname?: FilterableSpec<string> | boolean;
  port?: IncludableSpec | boolean;
  method?: IncludableSpec | boolean;
  pathname?: FilterableSpec<string> | boolean;
  body?: FilterableSpec<Buffer, Buffer | string> | boolean;
  query?: ListOrFilter | boolean;
  headers?: ListOrFilter | boolean;

  customData?: any | null;
}

export interface ChecksumReturn {
  content: string;
  checksum: string;
}
