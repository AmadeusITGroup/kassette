<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@amadeus-it-group/kassette](./kassette.md) &gt; [ChecksumArgs](./kassette.checksumargs.md)

## ChecksumArgs interface

Type of the argument expected by [checksum](./kassette.imock.checksum.md)<!-- -->. It specifies which data from the request to include in the checksum.

<b>Signature:</b>

```typescript
export interface ChecksumArgs 
```

## Remarks

To include or exclude data, not every kind of data from the request has the same complexity. For instance, the HTTP method is simple: use it or don't use it. But for things like query parameters, headers, body: you might want to select/filter.

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [body?](./kassette.checksumargs.body.md) | [FilterableSpec](./kassette.filterablespec.md)<!-- -->&lt;Buffer, Buffer \| string&gt; \| boolean | <i>(Optional)</i> Specifies whether and how to include the body of the request in the hash. The default value is <code>true</code>. |
|  [customData?](./kassette.checksumargs.customdata.md) | any \| null | <i>(Optional)</i> Any custom value (which can be JSON stringified) to be added in the content to be hashed. |
|  [format?](./kassette.checksumargs.format.md) | crypto.BinaryToTextEncoding | <i>(Optional)</i> Specifies the output format. Default value is <code>hex</code>. Check Node.js API for more information: [hash.digest(format)](https://nodejs.org/api/crypto.html#crypto_hash_digest_encoding)<!-- -->. |
|  [headers?](./kassette.checksumargs.headers.md) | [ListOrFilter](./kassette.listorfilter.md) \| boolean | <i>(Optional)</i> Specifies whether and how to include the headers in the hash. The default value is <code>false</code>. |
|  [hostname?](./kassette.checksumargs.hostname.md) | [FilterableSpec](./kassette.filterablespec.md)<!-- -->&lt;string&gt; \| boolean | <i>(Optional)</i> Specifies whether and how to include the hostname in the hash. The default value is <code>false</code>. |
|  [method?](./kassette.checksumargs.method.md) | [IncludableSpec](./kassette.includablespec.md) \| boolean | <i>(Optional)</i> Specifies whether to include the method in the hash. The default value is <code>false</code>. |
|  [pathname?](./kassette.checksumargs.pathname.md) | [FilterableSpec](./kassette.filterablespec.md)<!-- -->&lt;string&gt; \| boolean | <i>(Optional)</i> Specifies whether and how to include the pathname part of the url in the hash. The default value is <code>false</code>. |
|  [port?](./kassette.checksumargs.port.md) | [IncludableSpec](./kassette.includablespec.md) \| boolean | <i>(Optional)</i> Specifies whether to include the port in the hash. The default value is <code>false</code>. |
|  [protocol?](./kassette.checksumargs.protocol.md) | [IncludableSpec](./kassette.includablespec.md) \| boolean | <i>(Optional)</i> Specifies whether to include the protocol in the hash. The default value is <code>false</code>. |
|  [query?](./kassette.checksumargs.query.md) | [ListOrFilter](./kassette.listorfilter.md) \| boolean | <i>(Optional)</i> Specifies whether and how to include the query part of the url in the hash. The default value is <code>true</code>. |
|  [type?](./kassette.checksumargs.type.md) | string | <i>(Optional)</i> Specifies the hash algorithm. Default value is <code>sha256</code>. Check Node.js API for more information: [crypto.createHash(type)](https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options)<!-- -->. |
