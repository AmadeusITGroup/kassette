import * as crypto from 'crypto';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * @public
 */
export type MaybeAsync<Type> = Type | Promise<Type>;

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * @public
 */
export type Include = boolean | undefined;

export type DefaultInclude = boolean | null | undefined;

/**
 * @public
 */
export interface BaseSpec {
  include?: Include;
}

/**
 * @public
 */
export type Spec<Specific> = Include | Specific;

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * @public
 */
export type ProtocolSpec = BaseSpec;

/**
 * @public
 */
export interface HostnameSpec extends BaseSpec {
  filter?: (hostname: string) => MaybeAsync<string>;
}

/**
 * @public
 */
export type PortSpec = BaseSpec;

/**
 * @public
 */
export type MethodSpec = BaseSpec;

/**
 * @public
 */
export interface PathnameSpec extends BaseSpec {
  filter?: (pathname: string) => MaybeAsync<string>;
}

/**
 * @public
 */
export interface BodySpec extends BaseSpec {
  filter?: (body: Buffer) => MaybeAsync<Buffer | string>;
}

/**
 * @public
 */
export type ListMode = 'whitelist' | 'blacklist';

/**
 * @public
 */
export interface MapSpec extends BaseSpec {
  caseSensitive?: boolean;
}

/**
 * @public
 */
export interface ListSpec extends MapSpec {
  mode?: ListMode;
  keys: string[];
}

/**
 * @public
 */
export type ObjectMap = {
  [key in string]: any;
};

/**
 * @public
 */
export interface FilterSpec extends BaseSpec {
  filter: (values: ObjectMap) => ObjectMap;
}

/**
 * @public
 */
export type ListOrFilter = FilterSpec | MapSpec | ListSpec;

/**
 * @public
 */
export type QuerySpec = ListOrFilter;

/**
 * @public
 */
export type HeadersSpec = ListOrFilter;

export function isFilter(value: any): value is FilterSpec {
  return value.filter != null;
}

export function isListing(value: any): value is ListSpec {
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

  protocol?: Spec<ProtocolSpec>;
  hostname?: Spec<HostnameSpec>;
  port?: Spec<PortSpec>;
  method?: Spec<MethodSpec>;
  pathname?: Spec<PathnameSpec>;
  body?: Spec<BodySpec>;
  query?: Spec<QuerySpec>;
  headers?: Spec<HeadersSpec>;

  customData?: any | null;
}

export interface ChecksumReturn {
  content: string;
  checksum: string;
}
