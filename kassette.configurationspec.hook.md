<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@amadeus-it-group/kassette](./kassette.md) &gt; [ConfigurationSpec](./kassette.configurationspec.md) &gt; [hook](./kassette.configurationspec.hook.md)

## ConfigurationSpec.hook() method

Callback called for every HTTP request that kassette receives (with the exception of `CONNECT` requests, which trigger the call of [onProxyConnect](./kassette.configurationspec.onproxyconnect.md) instead).

<b>Signature:</b>

```typescript
hook?(parameters: HookAPI): void | Promise<void>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  parameters | [HookAPI](./kassette.hookapi.md) | exposes the API to control how to process the request |

<b>Returns:</b>

void \| Promise&lt;void&gt;
