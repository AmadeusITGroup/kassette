import * as crypto from 'crypto';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export type MaybeAsync<Type> = Type | Promise<Type>;

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export type Include = boolean | undefined;

export type DefaultInclude = boolean | null | undefined;

export interface BaseSpec {
  include?: Include;
}

export type Spec<Specific> = Include | Specific;

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

export interface ProtocolSpec extends BaseSpec {}

export interface HostnameSpec extends BaseSpec {
  filter?: (hostname: string) => MaybeAsync<string>;
}

export interface PortSpec extends BaseSpec {}

export interface MethodSpec extends BaseSpec {}

export interface PathnameSpec extends BaseSpec {
  filter?: (pathname: string) => MaybeAsync<string>;
}

export interface BodySpec extends BaseSpec {
  filter?: (body: Buffer) => MaybeAsync<Buffer | string>;
}

export type ListMode = 'whitelist' | 'blacklist';

interface MapSpec extends BaseSpec {
  caseSensitive?: boolean;
}

interface ListSpec extends MapSpec {
  mode?: ListMode;
  keys: string[];
}

export type ObjectMap = {
  [key in string]: any;
};

interface FilterSpec extends BaseSpec {
  filter: (values: ObjectMap) => ObjectMap;
}

export type ListOrFilter = FilterSpec | MapSpec | ListSpec;

export type QuerySpec = ListOrFilter;
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
