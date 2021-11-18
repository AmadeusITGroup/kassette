<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@amadeus-it-group/kassette](./kassette.md) &gt; [CLIConfigurationSpec](./kassette.cliconfigurationspec.md) &gt; [hostname](./kassette.cliconfigurationspec.hostname.md)

## CLIConfigurationSpec.hostname property

The hostname on which the proxy should listen. Uses `127.0.0.1` by default, which only allows local connections. To allow remote connections, use the ip address of the specific network interface that should be allowed to connect or the unspecified IPv4 (`0.0.0.0`<!-- -->) or IPv6 (`::`<!-- -->) address.

<b>Signature:</b>

```typescript
readonly hostname?: string;
```

## Remarks

Note that kassette has not been reviewed for security issues. It is intended to be used in a safe local/testing environment. Binding it to an open connection can result in compromising your computer or your network.
