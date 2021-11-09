<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@amadeus-it-group/kassette](./kassette.md) &gt; [IMock](./kassette.imock.md) &gt; [fillResponseFromPayload](./kassette.imock.fillresponsefrompayload.md)

## IMock.fillResponseFromPayload() method

Use data present in given wrapped payload to fill in the response.

<b>Signature:</b>

```typescript
fillResponseFromPayload(payload: PayloadWithOrigin): void;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  payload | [PayloadWithOrigin](./kassette.payloadwithorigin.md) | payload to use to fill the response. |

<b>Returns:</b>

void

## Remarks

This method changes [sourcePayload](./kassette.imock.sourcepayload.md)<!-- -->. It does nothing if [sourcePayload](./kassette.imock.sourcepayload.md) is already set.
