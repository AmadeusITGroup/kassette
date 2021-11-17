<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@amadeus-it-group/kassette](./kassette.md) &gt; [IMock](./kassette.imock.md) &gt; [readLocalPayloadAndFillResponse](./kassette.imock.readlocalpayloadandfillresponse.md)

## IMock.readLocalPayloadAndFillResponse() method

Combines [readLocalPayload](./kassette.imock.readlocalpayload.md) and [fillResponseFromPayload](./kassette.imock.fillresponsefrompayload.md) if there is a local payload then returns `true`<!-- -->, otherwise does nothing and return `false`<!-- -->.

<b>Signature:</b>

```typescript
readLocalPayloadAndFillResponse(): Promise<boolean>;
```
<b>Returns:</b>

Promise&lt;boolean&gt;
