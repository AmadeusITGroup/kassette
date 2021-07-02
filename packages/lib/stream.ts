////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/** An object which defines a method `on` to register event listeners, with event `data` and `end`, the former one sending a buffer to the provided callback */
export interface StreamLike {
  on(event: 'data', callback: (chunk: Buffer) => void): void;
  on(event: 'end', callback: () => void): void;
}

/** For Node.js Stream-like objects, fetches all the data and returns it as a buffer */
export async function readAll(message: StreamLike): Promise<Buffer> {
  return new Promise<Buffer>((resolve) => {
    const chunks: Buffer[] = [];
    message.on('data', (chunk: Buffer) => chunks.push(chunk));
    message.on('end', () => resolve(Buffer.concat(chunks)));
  });
}
