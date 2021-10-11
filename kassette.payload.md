<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@amadeus-it-group/kassette](./kassette.md) &gt; [Payload](./kassette.payload.md)

## Payload interface

The payload represents the content of an HTTP response from the backend, no matter if it actually comes from it or if it was created manually.

<b>Signature:</b>

```typescript
export interface Payload 
```

## Remarks

A payload is often wrapped in [PayloadWithOrigin](./kassette.payloadwithorigin.md)<!-- -->. To create the wrapped payload, you can use [createPayload](./kassette.imock.createpayload.md)<!-- -->.

From the wrapped payload, response to the client can be filled with [fillResponseFromPayload](./kassette.imock.fillresponsefrompayload.md)<!-- -->.

The payload can also be persisted and read, to avoid contacting the backend later on.

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [body](./kassette.payload.body.md) | Buffer \| string \| null | Body of the HTTP response. |
|  [data](./kassette.payload.data.md) | [MockData](./kassette.mockdata.md) | Data such as http status and headers, response delay. |
